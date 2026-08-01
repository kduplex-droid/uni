/**
 * UNIBITE Cloud Functions
 *
 * placeOrder — the ONLY way an order should be created from now on.
 * Runs with Admin SDK privileges (bypasses Firestore rules), so it is the
 * trusted source of truth for prices, stock, and totals. The client sends
 * ONLY { productId, qty } pairs — never price, name, or total. Everything
 * that matters gets recomputed here from the live product docs, inside a
 * transaction, so a tampered client can't lie about what it's buying.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

const VALID_CAMPUSES = ['upper', 'middle'];

exports.placeOrder = onCall({ region: 'us-central1' }, async (request) => {
  const auth = request.auth;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to place an order.');
  }

  const { cart, residence, phone, campus, deliveryTimeMode, scheduledTime } = request.data || {};

  // ── Basic input shape checks (cheap, fail fast before touching Firestore) ──
  if (!Array.isArray(cart) || cart.length === 0) {
    throw new HttpsError('invalid-argument', 'Your bag is empty.');
  }
  if (cart.length > 50) {
    throw new HttpsError('invalid-argument', 'Too many items in one order.');
  }
  for (const item of cart) {
    if (
      typeof item.productId !== 'string' ||
      !item.productId ||
      typeof item.qty !== 'number' ||
      !Number.isInteger(item.qty) ||
      item.qty <= 0 ||
      item.qty > 99
    ) {
      throw new HttpsError('invalid-argument', 'Invalid item in your bag.');
    }
  }
  if (!VALID_CAMPUSES.includes(campus)) {
    throw new HttpsError('invalid-argument', 'Invalid campus.');
  }
  if (typeof residence !== 'string' || !residence.trim()) {
    throw new HttpsError('invalid-argument', 'Please select a delivery venue.');
  }
  if (typeof phone !== 'string' || phone.replace(/[^0-9]/g, '').length < 9) {
    throw new HttpsError('invalid-argument', 'Please enter a valid phone number.');
  }
  const timeMode = deliveryTimeMode === 'sched' ? 'sched' : 'asap';
  if (timeMode === 'sched' && (typeof scheduledTime !== 'string' || !scheduledTime)) {
    throw new HttpsError('invalid-argument', 'Please pick a delivery time, or switch to ASAP.');
  }

  // De-dupe repeated productIds so someone can't send the same item twice
  // to smuggle extra qty past per-line checks in a weird way.
  const qtyById = new Map();
  for (const { productId, qty } of cart) {
    qtyById.set(productId, (qtyById.get(productId) || 0) + qty);
  }

  const orderRef = db.collection('orders').doc();

  const result = await db.runTransaction(async (txn) => {
    const ids = [...qtyById.keys()];
    const refs = ids.map((id) => db.collection('products').doc(id));
    const docs = await Promise.all(refs.map((ref) => txn.get(ref)));

    let subtotal = 0;
    const orderItems = [];

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const qty = qtyById.get(id);
      const doc = docs[i];

      if (!doc.exists) {
        throw new HttpsError('failed-precondition', `An item in your bag is no longer available.`);
      }
      const data = doc.data();

      if (data.inStock === false) {
        throw new HttpsError('failed-precondition', `"${data.name}" just went out of stock.`);
      }
      if (typeof data.stockQty === 'number' && data.stockQty < qty) {
        throw new HttpsError(
          'failed-precondition',
          `Only ${data.stockQty} × "${data.name}" left — someone just grabbed the rest.`
        );
      }
      if (typeof data.price !== 'number' || data.price <= 0) {
        throw new HttpsError('failed-precondition', `"${data.name}" has an invalid price. Contact support.`);
      }

      // Price, name, emoji, image all come from the server doc — never the client.
      subtotal += data.price * qty;
      orderItems.push({
        id,
        name: data.name,
        price: data.price,
        qty,
        emoji: data.emoji || '',
        imageUrl: data.imageUrl || '',
      });
    }

    const delivery = 0;
    const total = subtotal + delivery;

    // ── Write phase ──
    refs.forEach((ref, i) => {
      const id = ids[i];
      const qty = qtyById.get(id);
      const data = docs[i].data();
      if (typeof data.stockQty === 'number') {
        const newQty = data.stockQty - qty;
        txn.update(ref, { stockQty: newQty, inStock: newQty > 0 });
      }
    });

    const n = 10000 + Math.floor(Math.random() * 90000);
    const orderNum = `#UNI-${n}`;

    txn.set(orderRef, {
      orderNum,
      userId: auth.uid,
      userEmail: auth.token.email || '',
      userDisplayName: auth.token.name || '',
      items: orderItems,
      subtotal,
      delivery,
      total,
      campus,
      residence: residence.trim(),
      phone: phone.trim(),
      deliveryTimeMode: timeMode,
      scheduledTime: scheduledTime || '',
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    });

    return { orderId: orderRef.id, orderNum, total };
  });

  return result;
});
