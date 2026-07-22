/* ============================================================
 * UNIBITE — app.js
 * Combined JS: cinematic loader IIFE + main app logic
 * (extracted from the original single-file index.html)
 * ============================================================ */

(function(){
  const EASEOUT='cubic-bezier(0.22,1,0.36,1)',EASEINOUT='cubic-bezier(0.4,0,0.2,1)';
  const stars=document.getElementById('ldr-stars');
  for(let i=0;i<32;i++){const s=document.createElement('div');s.className='ldr-star';const sz=Math.random()*2.5+1;s.style.cssText='width:'+sz+'px;height:'+sz+'px;left:'+(Math.random()*100)+'%;top:'+(Math.random()*100)+'%;--dur:'+(2+Math.random()*2)+'s;--delay:-'+(Math.random()*4)+'s;';stars.appendChild(s);}
  const WORD='UNIBITE';
  const traj=[[-180,-90,-20,0],[-110,160,16,80],[-50,-140,-10,150],[70,170,24,220],[150,-80,-18,290],[190,80,13,360],[-160,50,-28,430]];
  const wrap=document.getElementById('ldr-word');const letters=[];
  WORD.split('').forEach((ch,i)=>{const el=document.createElement('span');el.className='ldr-letter';el.textContent=ch;wrap.appendChild(el);letters.push(el);const[tx,ty,rot,delay]=traj[i];el.animate([{opacity:0,transform:'translate('+tx+'px,'+ty+'px) rotate('+rot+'deg) scale(0.35)',offset:0},{opacity:1,transform:'translate(0,0) rotate(0deg) scale(1.07)',offset:0.72},{opacity:1,transform:'translate(0,4px) rotate(0deg) scale(0.97)',offset:0.86},{opacity:1,transform:'translate(0,0) rotate(0deg) scale(1)',offset:1}],{duration:680,delay,easing:EASEOUT,fill:'both'});});
  document.getElementById('ldr-tagline').animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:500,delay:900,easing:EASEINOUT,fill:'both'});
  const barWrap=document.getElementById('ldr-bar-wrap'),bar=document.getElementById('ldr-bar');
  barWrap.animate([{opacity:0},{opacity:1}],{duration:300,delay:1050,easing:EASEINOUT,fill:'both'});
  bar.animate([{width:'0%',offset:0},{width:'68%',offset:0.45},{width:'84%',offset:0.72},{width:'100%',offset:1}],{duration:1400,delay:1100,easing:EASEINOUT,fill:'both'});
  setTimeout(()=>{letters.forEach((el,i)=>{el.animate([{textShadow:'0 0 0px #C084FC00'},{textShadow:'0 0 22px #C084FCaa'},{textShadow:'0 0 0px #C084FC00'}],{duration:900,delay:i*40,easing:EASEINOUT,fill:'none'});});},1200);
  setTimeout(()=>{const l=document.getElementById('cinematic-loader');l.classList.add('fade-out');setTimeout(()=>{l.style.display='none';},720);},2750);
})();

/* ============================================================
 * UNIBITE — Firebase-powered UCT campus snack shop
 * ============================================================ */

const firebaseConfig={
  apiKey:"AIzaSyDRQMKVqJLsG2uRGKWAUNCyk0d14mGg42Q",
  authDomain:"uni-bites-398d9.firebaseapp.com",
  projectId:"uni-bites-398d9",
  storageBucket:"uni-bites-398d9.firebasestorage.app",
  messagingSenderId:"387128538792",
  appId:"1:387128538792:web:f40aae63b45e314176349d"
};
const ADMIN_EMAIL='k.duplex16@gmail.com';
firebase.initializeApp(firebaseConfig);
const db=firebase.firestore(),auth=firebase.auth(),storage=firebase.storage();
const googleProvider=new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({prompt:'select_account'});

const APP={
  user:null,isAdmin:false,
  products:[],orders:[],
  cart:[],lastOrder:null,
  currentFilter:'all',currentCampus:'upper',
  orderNum:null,etaTime:null,deliveryTimeMode:'asap',
  pendingImageUrl:null,
  activeOrderId:null,
  activeOrderUnsub:null,
};

const RESIDENCES={
  upper:['UCR','Fuller Hall','Hlanganani','Leslie Social','Chris Hani','Oppenheimer Library','Sarah Baartman Stairs'],
  middle:['School of Economics','Kramer Library','Woolsack'],
};

function esc(str){if(str===null||str===undefined)return '';return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');}

function friendlyAuthError(code){
  const msgs={
    'auth/user-not-found':'No account found with this email.',
    'auth/wrong-password':'Incorrect password. Please try again.',
    'auth/invalid-credential':'Incorrect email or password.',
    'auth/email-already-in-use':'An account already exists with this email.',
    'auth/weak-password':'Password must be at least 6 characters.',
    'auth/invalid-email':'Please enter a valid email address.',
    'auth/too-many-requests':'Too many attempts — please wait a few minutes.',
    'auth/network-request-failed':'Network error — check your connection.',
    'auth/requires-recent-login':'Please sign out and sign in again to do this.',
    'auth/missing-password':'Please enter your password.',
    'auth/popup-closed-by-user':'Sign-in popup was closed before completing.',
    'auth/popup-blocked':'Popup was blocked by your browser. Please allow popups and try again.',
    'auth/cancelled-popup-request':'Sign-in was cancelled.',
    'auth/account-exists-with-different-credential':'An account already exists with this email using a different sign-in method. Try signing in with email/password instead.',
    'auth/unauthorized-domain':'This domain is not authorised for Google sign-in yet.',
  };
  return msgs[code]||'Something went wrong. Please try again.';
}

/* ── THEME TOGGLE ─────────────────────────────────────────── */
let isLightMode=false;
function toggleTheme(){
  isLightMode=!isLightMode;
  document.body.classList.toggle('light-mode',isLightMode);
  document.getElementById('theme-toggle').textContent=isLightMode?'🌙':'☀️';
  try{localStorage.setItem('ub_theme',isLightMode?'light':'dark');}catch(_){}
}
(function(){try{const t=localStorage.getItem('ub_theme');if(t==='light'){isLightMode=true;document.body.classList.add('light-mode');}}catch(_){}})();

/* ── AUTH WALL — EMAIL + PASSWORD ────────────────────────── */
let currentAuthTab='signin';

function switchAuthTab(tab){
  currentAuthTab=tab;
  document.getElementById('tab-signin').classList.toggle('active',tab==='signin');
  document.getElementById('tab-signup').classList.toggle('active',tab==='signup');
  document.getElementById('signin-form').style.display=tab==='signin'?'block':'none';
  document.getElementById('signup-form').style.display=tab==='signup'?'block':'none';
  clearWallMessages();
}

function showWallError(msg){
  const el=document.getElementById('wall-err');
  el.textContent=msg;el.classList.add('show');
  document.getElementById('wall-success').classList.remove('show');
}
function showWallSuccess(msg){
  const el=document.getElementById('wall-success');
  el.textContent=msg;el.classList.add('show');
  document.getElementById('wall-err').classList.remove('show');
}
function clearWallMessages(){
  document.getElementById('wall-err').classList.remove('show');
  document.getElementById('wall-success').classList.remove('show');
}

function togglePw(inputId,btn){
  const inp=document.getElementById(inputId);
  if(inp.type==='password'){inp.type='text';btn.textContent='🙈';}
  else{inp.type='password';btn.textContent='👁';}
}

function checkPwStrength(val){
  const bar=document.getElementById('pw-strength-bar');
  const hint=document.getElementById('pw-hint');
  if(!val){bar.style.width='0%';hint.textContent='Enter a password';return;}
  let score=0;
  if(val.length>=6)score++;
  if(val.length>=10)score++;
  if(/[A-Z]/.test(val))score++;
  if(/[0-9]/.test(val))score++;
  if(/[^A-Za-z0-9]/.test(val))score++;
  const levels=[
    {pct:'20%',bg:'var(--red)',text:'Too short'},
    {pct:'40%',bg:'#F97316',text:'Weak'},
    {pct:'60%',bg:'var(--candy-yellow)',text:'Fair'},
    {pct:'80%',bg:'#84CC16',text:'Good'},
    {pct:'100%',bg:'var(--candy-mint)',text:'Strong'},
  ];
  const lvl=levels[Math.min(score,4)];
  bar.style.width=lvl.pct;
  bar.style.background=lvl.bg;
  hint.textContent=lvl.text;
}

/* ── GOOGLE SIGN-IN ───────────────────────────────────────── */
function doGoogleSignIn(){
  clearWallMessages();
  const btn=document.getElementById('google-btn');
  btn.disabled=true;
  const originalHTML=btn.innerHTML;
  btn.innerHTML='Signing in…';
  auth.signInWithPopup(googleProvider)
    .catch(err=>{
      console.error('Google sign-in error:',err.code,err.message);
      showWallError(friendlyAuthError(err.code));
    })
    .finally(()=>{
      btn.disabled=false;
      btn.innerHTML=originalHTML;
    });
}

function doSignIn(){
  clearWallMessages();
  const email=document.getElementById('signin-email').value.trim();
  const password=document.getElementById('signin-password').value;
  if(!email||!password){showWallError('Please enter your email and password.');return;}
  const btn=document.getElementById('signin-btn');
  btn.disabled=true;btn.textContent='Signing in…';
  auth.signInWithEmailAndPassword(email,password)
    .catch(err=>showWallError(friendlyAuthError(err.code)))
    .finally(()=>{btn.disabled=false;btn.textContent='Sign In →';});
}

function doSignUp(){
  clearWallMessages();
  const name=document.getElementById('signup-name').value.trim();
  const email=document.getElementById('signup-email').value.trim();
  const password=document.getElementById('signup-password').value;
  const confirm=document.getElementById('signup-confirm').value;
  if(!name){showWallError('Please enter your name.');return;}
  if(!email){showWallError('Please enter your email.');return;}
  if(!password||password.length<6){showWallError('Password must be at least 6 characters.');return;}
  if(password!==confirm){showWallError('Passwords do not match.');return;}

  const btn=document.getElementById('signup-btn');
  btn.disabled=true;btn.textContent='Checking email…';

  // Pre-check: does this email already have an account (with any provider)?
  auth.fetchSignInMethodsForEmail(email).then(methods=>{
    if(methods && methods.length>0){
      const usesGoogle=methods.includes('google.com');
      showWallError(usesGoogle
        ? 'An account already exists with this email via Google. Use "Continue with Google" instead.'
        : 'An account already exists with this email. Try signing in instead.');
      btn.disabled=false;btn.textContent='Create Account →';
      switchAuthTab('signin');
      document.getElementById('signin-email').value=email;
      return;
    }
    btn.textContent='Creating account…';
    return auth.createUserWithEmailAndPassword(email,password)
      .then(cred=>cred.user.updateProfile({displayName:name}))
      .catch(err=>showWallError(friendlyAuthError(err.code)))
      .finally(()=>{btn.disabled=false;btn.textContent='Create Account →';});
  }).catch(err=>{
    // If enumeration protection blocks fetchSignInMethodsForEmail, fall back to direct creation;
    // Firebase's own auth/email-already-in-use check will still catch duplicates.
    btn.textContent='Creating account…';
    auth.createUserWithEmailAndPassword(email,password)
      .then(cred=>cred.user.updateProfile({displayName:name}))
      .catch(err2=>showWallError(friendlyAuthError(err2.code)))
      .finally(()=>{btn.disabled=false;btn.textContent='Create Account →';});
  });
}

function doForgotPassword(){
  clearWallMessages();
  const email=document.getElementById('signin-email').value.trim();
  if(!email){showWallError('Enter your email address above first.');return;}
  auth.sendPasswordResetEmail(email)
    .then(()=>showWallSuccess('Password reset email sent! Check your inbox.'))
    .catch(err=>showWallError(friendlyAuthError(err.code)));
}

function doChangePassword(){
  if(APP.user&&APP.user.providerData&&APP.user.providerData.some(p=>p.providerId==='google.com')&&!APP.user.providerData.some(p=>p.providerId==='password')){
    alert('You signed in with Google, so there\'s no password to change here. Manage your password through your Google Account.');
    return;
  }
  const newPw=prompt('Enter your new password (min. 6 characters):');
  if(!newPw)return;
  if(newPw.length<6){alert('Password must be at least 6 characters.');return;}
  APP.user.updatePassword(newPw)
    .then(()=>alert('✅ Password updated successfully!'))
    .catch(err=>alert(friendlyAuthError(err.code)));
}

/* ── ADMIN GATE ───────────────────────────────────────────── */
let adminGateOpen=false,logoTapCount=0,logoTapTimer=null;
function handleLogoTap(){logoTapCount++;clearTimeout(logoTapTimer);logoTapTimer=setTimeout(()=>{logoTapCount=0;},700);if(logoTapCount>=3){logoTapCount=0;openAdminGate();}}
window.addEventListener('keydown',e=>{if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='a'){e.preventDefault();openAdminGate();}});
function openAdminGate(){if(APP.isAdmin){navigate('admin');return;}adminGateOpen=true;const modal=document.getElementById('admin-gate-modal');modal.classList.add('show');document.getElementById('admin-gate-error').classList.remove('show');document.getElementById('admin-gate-email').value='';document.getElementById('admin-gate-password').value='';document.getElementById('admin-gate-submit').disabled=false;document.getElementById('admin-gate-submit').textContent='Sign In to Admin';}
function closeAdminGate(){adminGateOpen=false;document.getElementById('admin-gate-modal').classList.remove('show');}
function showGateError(msg){const el=document.getElementById('admin-gate-error');el.textContent=msg;el.classList.add('show');}
function adminGateSignIn(){
  const email=document.getElementById('admin-gate-email').value.trim(),password=document.getElementById('admin-gate-password').value;
  document.getElementById('admin-gate-error').classList.remove('show');
  if(!email||!password){showGateError('Please enter your email and password.');return;}
  if(email.toLowerCase()!==ADMIN_EMAIL){showGateError('⛔ This email does not have admin access.');return;}
  const btn=document.getElementById('admin-gate-submit');btn.disabled=true;btn.textContent='Signing in…';
  const doSignIn=()=>auth.signInWithEmailAndPassword(email,password).catch(err=>{showGateError(friendlyAuthError(err.code));btn.disabled=false;btn.textContent='Sign In to Admin';});
  if(APP.user&&!APP.isAdmin){auth.signOut().then(doSignIn);}else{doSignIn();}
}

/* ── AUTH STATE ───────────────────────────────────────────── */
auth.onAuthStateChanged(user=>{
  APP.user=user;APP.isAdmin=!!(user&&user.email&&user.email.toLowerCase()===ADMIN_EMAIL);
  if(user){
    document.getElementById('auth-wall').classList.add('hidden');
    document.getElementById('top-nav').style.display='';
    document.getElementById('marquee-bar').style.display='';
    document.getElementById('bottom-nav').style.display='';
    document.getElementById('theme-toggle').style.display='';
    document.getElementById('user-display-name').textContent=user.displayName||'UCT Student';
    document.getElementById('user-display-email').textContent=user.email;
    document.getElementById('admin-user-email').textContent=user.email;
    document.getElementById('theme-toggle').textContent=isLightMode?'🌙':'☀️';
    const avatarWrap=document.getElementById('user-avatar-wrap');
    if(avatarWrap){avatarWrap.innerHTML=user.photoURL?`<img src="${esc(user.photoURL)}" alt="${esc(user.displayName||'')}">`:'🎓';}
    const isGoogleOnly=user.providerData&&user.providerData.length&&user.providerData.every(p=>p.providerId==='google.com');
    const changePwBtn=document.getElementById('change-pw-btn');
    if(changePwBtn)changePwBtn.style.display=isGoogleOnly?'none':'block';
    if(adminGateOpen){if(APP.isAdmin){closeAdminGate();navigate('admin');}else{showGateError('⛔ This account does not have admin access.');document.getElementById('admin-gate-submit').disabled=false;document.getElementById('admin-gate-submit').textContent='Sign In to Admin';}}
    startProductListener();
    startCartListener(user.uid);
    loadActiveOrder(user.uid);
  }else{
    document.getElementById('auth-wall').classList.remove('hidden');
    document.getElementById('top-nav').style.display='none';
    document.getElementById('marquee-bar').style.display='none';
    document.getElementById('bottom-nav').style.display='none';
    document.getElementById('theme-toggle').style.display='none';
    stopCartListener();
    stopActiveOrderListener();
    if(currentScreen==='admin'){currentScreen='home';CUSTOMER_SCREENS.forEach(s=>{const el=document.getElementById(s+'-screen');if(el)el.classList.toggle('active',s==='home');});document.getElementById('admin-screen').style.display='none';}
  }
});
function signOut(){const finish=()=>auth.signOut().then(()=>{currentScreen='home';});saveCart().then(finish,finish);}

/* ── NAVIGATION ───────────────────────────────────────────── */
const CUSTOMER_SCREENS=['home','auth','shop','cart','checkout','confirm','tracking'];
const BNAV_MAP={home:'bnav-home',shop:'bnav-shop',cart:'bnav-cart',tracking:'bnav-tracking',auth:'bnav-auth'};
let currentScreen='home';
function navigate(screen,filterCat){
  if(screen==='admin'&&!APP.isAdmin){openAdminGate();return;}
  currentScreen=screen;
  const isAdmin=screen==='admin';
  document.getElementById('top-nav').style.display=isAdmin?'none':'';
  document.getElementById('marquee-bar').style.display=isAdmin?'none':'';
  document.getElementById('bottom-nav').style.display=isAdmin?'none':'';
  document.getElementById('theme-toggle').style.display=(isAdmin||!APP.user)?'none':'';
  document.getElementById('admin-screen').style.display=isAdmin?'block':'none';
  CUSTOMER_SCREENS.forEach(s=>{const el=document.getElementById(s+'-screen');if(el)el.classList.toggle('active',s===screen);});
  Object.keys(BNAV_MAP).forEach(k=>{document.getElementById(BNAV_MAP[k])?.classList.toggle('active',k===screen);});
  if(screen==='home')renderProductGrid('home-products',true);
  if(screen==='shop'){if(filterCat)setFilterByKey(filterCat);renderProductGrid('shop-products',false);}
  if(screen==='cart')renderCart();
  if(screen==='checkout')renderCheckoutSummary();
  if(screen==='tracking')renderTracking();
  if(screen==='admin'){renderAdminPanel();startOrdersListener();}
  window.scrollTo(0,0);
}

/* ── CART ─────────────────────────────────────────────────── */
let cartUnsub=null,cartListenerUid=null;
function startCartListener(uid){
  if(cartListenerUid===uid&&cartUnsub)return;
  stopCartListener();cartListenerUid=uid;
  cartUnsub=db.collection('carts').doc(uid).onSnapshot(doc=>{
    const data=doc.exists?doc.data():null;
    APP.cart=(data&&Array.isArray(data.items))?data.items:[];
    updateCartBadge();
    if(currentScreen==='cart')renderCart();
    if(currentScreen==='checkout')renderCheckoutSummary();
  },err=>{if(err.code==='permission-denied'){APP.cart=[];updateCartBadge();}});
}
function stopCartListener(){if(cartUnsub)cartUnsub();cartUnsub=null;cartListenerUid=null;APP.cart=[];updateCartBadge();}
function saveCart(){
  if(!APP.user)return Promise.resolve();
  const items=APP.cart.map(i=>({id:i.id,name:i.name,price:i.price,qty:i.qty,emoji:i.emoji||'',imageUrl:i.imageUrl||'',brand:i.brand||''}));
  return db.collection('carts').doc(APP.user.uid).set({items,userId:APP.user.uid,updatedAt:firebase.firestore.FieldValue.serverTimestamp()}).catch(err=>console.error('Cart save failed:',err.code));
}

/* ── ACTIVE ORDER LISTENER ────────────────────────────────── */
function loadActiveOrder(uid){
  stopActiveOrderListener();
  db.collection('orders').where('userId','==',uid).where('status','in',['pending','confirmed','packing','delivering']).orderBy('createdAt','desc').limit(1).onSnapshot(snap=>{
    const dot=document.getElementById('track-live-dot');
    if(!snap.empty){
      const doc=snap.docs[0];
      const data={id:doc.id,...doc.data()};
      APP.activeOrderId=data.id;
      APP.orderNum=data.orderNum;
      if(data.adminEta)APP.etaTime=new Date(data.adminEta);
      else if(data.eta)APP.etaTime=new Date(data.eta);
      APP.lastOrder={items:data.items||[],total:data.total||0};
      if(dot)dot.style.display='block';
      if(currentScreen==='tracking')renderTracking();
    }else{
      APP.activeOrderId=null;
      if(dot)dot.style.display='none';
      if(currentScreen==='tracking')renderTracking();
    }
  },err=>console.error('Active order listener:',err));
}
function stopActiveOrderListener(){if(APP.activeOrderUnsub){APP.activeOrderUnsub();APP.activeOrderUnsub=null;}APP.activeOrderId=null;}

/* ── PRODUCTS ─────────────────────────────────────────────── */
let productListenerActive=false;
function startProductListener(){
  if(productListenerActive)return;productListenerActive=true;
  db.collection('products').orderBy('createdAt','desc').onSnapshot(snapshot=>{
    APP.products=snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
    if(currentScreen==='home')renderProductGrid('home-products',true);
    if(currentScreen==='shop')renderProductGrid('shop-products',false);
    if(currentScreen==='admin')renderAdminPanel();
  },err=>console.error('Products listener:',err));
}
function getCatBg(cat){return{chips:'#1a1206',drinks:'#0d1a10',sweets:'#1a0e00',meals:'#1a0a00'}[cat]||'#1a1a1a';}
function getStockBadge(p){const qty=p.stockQty;if(qty===undefined||qty===null)return '';if(qty===0)return '<span class="stock-badge stock-out">OUT OF STOCK</span>';if(qty<=5)return '<span class="stock-badge stock-low">'+qty+' LEFT</span>';return '<span class="stock-badge stock-high">'+qty+' IN STOCK</span>';}
function productCardHTML(p){
  const outOfStock=p.stockQty===0;
  const img=p.imageUrl?`<img src="${esc(p.imageUrl)}" alt="${esc(p.name)}" loading="lazy">`:`<span style="font-size:42px">${esc(p.emoji)||'🍬'}</span>`;
  return `<div class="prod-card">
    <div class="prod-img" style="${p.imageUrl?'':'background:'+getCatBg(p.category)}">
      ${p.isHot&&!outOfStock?'<span class="prod-badge">🔥 HOT</span>':''}
      ${outOfStock?'<span class="prod-badge" style="background:linear-gradient(135deg,#F87171,#DC2626);color:#fff;box-shadow:0 2px 0 #991B1B;">SOLD OUT</span>':''}
      ${img}
    </div>
    <div class="prod-info">
      <div class="prod-brand">${esc(p.brand)}</div>
      <div class="prod-name">${esc(p.name)}</div>
      ${getStockBadge(p)}
      <div class="prod-row" style="margin-top:6px;">
        <span class="prod-price">R${esc(p.price)}</span>
        <button class="add-btn" id="add-${esc(p.id)}" onclick="addToCart('${esc(p.id)}')" ${outOfStock?'disabled':''}>+</button>
      </div>
    </div>
  </div>`;
}
function renderProductGrid(containerId,hotOnly){
  const container=document.getElementById(containerId);if(!container)return;
  let prods=APP.products.filter(p=>p.inStock!==false);
  if(hotOnly)prods=prods.filter(p=>p.isHot).slice(0,4);
  if(APP.currentFilter!=='all'&&!hotOnly)prods=prods.filter(p=>p.category===APP.currentFilter);
  container.innerHTML=prods.length?'<div class="products-grid">'+prods.map(productCardHTML).join('')+'</div>':'<div class="empty-state"><span class="empty-state-icon">🕐</span><div class="empty-state-title">No snacks here yet</div><div class="empty-state-sub">Check back soon!</div></div>';
}
function setFilter(cat,el){APP.currentFilter=cat;document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));el.classList.add('active');renderProductGrid('shop-products',false);}
function setFilterByKey(cat){APP.currentFilter=cat;document.querySelectorAll('.filter-chip').forEach(c=>{c.classList.remove('active');if(c.textContent.toLowerCase().includes(cat))c.classList.add('active');});if(cat==='all')document.querySelector('.filter-chip').classList.add('active');}
function filterProducts(val){
  const v=val.toLowerCase(),container=document.getElementById('shop-products');
  let prods=APP.products.filter(p=>p.inStock!==false);
  if(APP.currentFilter!=='all')prods=prods.filter(p=>p.category===APP.currentFilter);
  if(v)prods=prods.filter(p=>p.name.toLowerCase().includes(v)||(p.brand||'').toLowerCase().includes(v));
  container.innerHTML=prods.length?'<div class="products-grid">'+prods.map(productCardHTML).join('')+'</div>':'<div class="empty-state"><span class="empty-state-icon">🔍</span><div class="empty-state-title">No results</div></div>';
}

/* ── CART LOGIC ───────────────────────────────────────────── */
let _stockToastTimer=null;
function showStockToast(name,qty){
  let toast=document.getElementById('stock-toast');
  if(!toast){toast=document.createElement('div');toast.id='stock-toast';toast.style.cssText='position:fixed;bottom:88px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--surface);border:1.5px solid var(--candy-yellow);border-radius:14px;padding:10px 18px;font-size:12px;font-weight:800;color:var(--candy-yellow);z-index:500;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.4);opacity:0;transition:opacity .2s,transform .2s;pointer-events:none;max-width:300px;';document.body.appendChild(toast);}
  clearTimeout(_stockToastTimer);
  toast.textContent='⚠️ Only '+qty+' × '+name+' available — can\'t add more!';
  toast.style.opacity='1';toast.style.transform='translateX(-50%) translateY(0)';
  _stockToastTimer=setTimeout(()=>{toast.style.opacity='0';toast.style.transform='translateX(-50%) translateY(8px)';},2800);
}

function updateCartBadge(){const t=APP.cart.reduce((a,i)=>a+i.qty,0);const b=document.getElementById('cart-badge');b.textContent=t;b.classList.toggle('hidden',t===0);}

function addToCart(productId){
  if(!APP.user)return;
  const prod=APP.products.find(p=>p.id===productId);if(!prod)return;
  if(prod.stockQty===0)return;
  const ex=APP.cart.find(i=>i.id===productId);
  const currentInCart=ex?ex.qty:0;
  if(prod.stockQty!==undefined&&prod.stockQty!==null&&currentInCart>=prod.stockQty){
    const btn=document.getElementById('add-'+productId);
    if(btn){const orig=btn.textContent;btn.textContent='Max';btn.style.background='linear-gradient(135deg,var(--candy-yellow),#F59E0B)';btn.style.color='#1A1A00';setTimeout(()=>{btn.textContent=orig;btn.style.background='';btn.style.color='';},1200);}
    showStockToast(prod.name,prod.stockQty);return;
  }
  if(ex)ex.qty++;else APP.cart.push({...prod,qty:1});
  updateCartBadge();saveCart();
  const btn=document.getElementById('add-'+productId);
  if(btn){btn.textContent='✓';btn.classList.add('added-flash');setTimeout(()=>{btn.textContent='+';btn.classList.remove('added-flash');},700);}
}

function getCartTotals(){const sub=APP.cart.reduce((a,i)=>a+i.price*i.qty,0);return{sub,delivery:0,total:sub};}

function renderCart(){
  const list=document.getElementById('cart-items-list'),empty=document.getElementById('cart-empty'),full=document.getElementById('cart-full');
  const qty=APP.cart.reduce((a,i)=>a+i.qty,0);
  document.getElementById('cart-count-label').textContent=qty;
  if(!APP.cart.length){list.innerHTML='';empty.style.display='flex';empty.style.flexDirection='column';empty.style.alignItems='center';full.style.display='none';}
  else{
    empty.style.display='none';full.style.display='block';
    list.innerHTML=APP.cart.map((item,idx)=>`<div class="cart-item">
      <div class="cart-thumb">${item.imageUrl?`<img src="${esc(item.imageUrl)}" alt="${esc(item.name)}">`:`<span style="font-size:22px">${esc(item.emoji)||'🍬'}</span>`}</div>
      <div class="cart-item-info"><div class="cart-item-brand">${esc(item.brand)}</div><div class="cart-item-name">${esc(item.name)}</div></div>
      <div class="cart-item-controls"><button class="qty-btn" onclick="changeQty(${idx},-1)">−</button><span class="qty-num">${item.qty}</span><button class="qty-btn" onclick="changeQty(${idx},1)">+</button></div>
      <div class="cart-item-price">R${esc(item.price*item.qty)}</div>
      <button class="remove-btn" onclick="removeFromCart(${idx})">×</button>
    </div>`).join('');
    updateCartSummary();
  }
}

function updateCartSummary(){
  const{sub,total}=getCartTotals();
  document.getElementById('sum-sub').textContent='R'+sub;
  document.getElementById('sum-total').textContent='R'+total;
}

function changeQty(idx,delta){
  const item=APP.cart[idx];
  const prod=APP.products.find(p=>p.id===item.id);
  const newQty=Math.max(1,item.qty+delta);
  if(delta>0&&prod&&prod.stockQty!==undefined&&prod.stockQty!==null&&newQty>prod.stockQty){showStockToast(item.name,prod.stockQty);return;}
  item.qty=newQty;updateCartBadge();renderCart();saveCart();
}

function removeFromCart(idx){APP.cart.splice(idx,1);updateCartBadge();renderCart();saveCart();}

/* ── CHECKOUT ─────────────────────────────────────────────── */
function setCampus(campus){
  APP.currentCampus=campus;
  document.getElementById('campus-upper').classList.toggle('selected',campus==='upper');
  document.getElementById('campus-middle').classList.toggle('selected',campus==='middle');
  const sel=document.getElementById('res-select');
  sel.innerHTML='<option value="">Select a delivery venue</option>'+RESIDENCES[campus].map(r=>`<option>${r}</option>`).join('');
}
function setTime(t){document.getElementById('time-asap').classList.toggle('selected',t==='asap');document.getElementById('time-sched').classList.toggle('selected',t==='sched');document.getElementById('sched-time-group').style.display=t==='sched'?'block':'none';APP.deliveryTimeMode=t;}
function selectPay(el){document.querySelectorAll('.pay-opt').forEach(e=>e.classList.remove('selected'));el.classList.add('selected');}
function renderCheckoutSummary(){
  const{sub,total}=getCartTotals(),qty=APP.cart.reduce((a,i)=>a+i.qty,0);
  document.getElementById('co-items').textContent=qty+' item'+(qty!==1?'s':'');
  document.getElementById('co-sub').textContent='R'+sub;
  document.getElementById('co-total').textContent='R'+total;
  setCampus('upper');
  setTime('asap');
  document.getElementById('checkout-error').style.display='none';
}

function showCheckoutError(msg){const el=document.getElementById('checkout-error');el.textContent=msg;el.style.display='block';}

function placeOrder(){
  const errEl=document.getElementById('checkout-error');errEl.style.display='none';
  if(!APP.user){showCheckoutError('Please sign in to place an order.');return;}
  if(!APP.cart.length){showCheckoutError('Your bag is empty — add some snacks first.');return;}
  const residence=document.getElementById('res-select')?.value||'';
  if(!residence){showCheckoutError('Please select a delivery venue.');return;}
  const phone=(document.getElementById('co-phone')?.value||'').trim();
  if(!phone){showCheckoutError('Please enter your WhatsApp number.');return;}
  if(phone.replace(/[^0-9]/g,'').length<9){showCheckoutError('Please enter a valid phone number.');return;}
  let scheduledTime='';
  if(APP.deliveryTimeMode==='sched'){
    scheduledTime=document.getElementById('co-sched-time')?.value||'';
    if(!scheduledTime){showCheckoutError('Please pick a delivery time, or switch to ASAP.');return;}
  }
  // Re-check stock against the latest known product data before submitting
  for(const item of APP.cart){
    const prod=APP.products.find(p=>p.id===item.id);
    if(!prod||prod.inStock===false||prod.stockQty===0){showCheckoutError(`Sorry, "${item.name}" just went out of stock. Please remove it from your bag.`);return;}
    if(prod.stockQty!==undefined&&prod.stockQty!==null&&item.qty>prod.stockQty){showCheckoutError(`Only ${prod.stockQty} × "${item.name}" left in stock. Please adjust your bag.`);return;}
  }

  const btn=document.getElementById('place-order-btn');
  if(btn.disabled)return; // guard against double-submit
  btn.disabled=true;btn.textContent='Placing order…';

  const arr=new Uint32Array(1);crypto.getRandomValues(arr);
  const n=(arr[0]%90000)+10000;const orderNum='#UNI-'+n;
  const{sub,total}=getCartTotals();
  const cartSnapshot=APP.cart.map(i=>({...i}));
  const orderPayload={
    orderNum,userId:APP.user.uid,userEmail:APP.user.email||'',userDisplayName:APP.user.displayName||'',
    items:cartSnapshot.map(i=>({id:i.id,name:i.name,price:i.price,qty:i.qty,emoji:i.emoji||'',imageUrl:i.imageUrl||''})),
    subtotal:sub,delivery:0,total,campus:APP.currentCampus,residence,phone,
    deliveryTimeMode:APP.deliveryTimeMode,scheduledTime,
    status:'pending',
    createdAt:firebase.firestore.FieldValue.serverTimestamp(),
  };

  db.collection('orders').add(orderPayload).then(ref=>{
    // Order is confirmed saved — now decrement stock atomically and clear the cart.
    cartSnapshot.forEach(item=>{
      const prod=APP.products.find(p=>p.id===item.id);
      if(prod&&prod.stockQty!==undefined&&prod.stockQty!==null){
        db.collection('products').doc(item.id).update({stockQty:firebase.firestore.FieldValue.increment(-item.qty)})
          .catch(e=>console.warn('Stock update:',e));
      }
    });
    APP.activeOrderId=ref.id;
    APP.orderNum=orderNum;
    APP.lastOrder={items:cartSnapshot,total};
    if(APP.user)loadActiveOrder(APP.user.uid);
    APP.cart=[];updateCartBadge();saveCart();
    document.getElementById('confirm-order-num').textContent=orderNum;
    document.getElementById('confirm-eta').textContent='Admin will set your ETA shortly ⏳';
    btn.disabled=false;btn.textContent='Place order →';
    navigate('confirm');
  }).catch(err=>{
    console.error('Order save failed:',err);
    showCheckoutError('Something went wrong placing your order. Please check your connection and try again.');
    btn.disabled=false;btn.textContent='Place order →';
  });
}

/* ── TRACKING ─────────────────────────────────────────────── */
const STATUS_CONFIG={
  pending:  {emoji:'📦',title:'Order Received',desc:'Waiting for confirmation',prog:'10%',step:0},
  confirmed:{emoji:'✅',title:'Order Confirmed',desc:'Your order has been confirmed',prog:'30%',step:1},
  packing:  {emoji:'📦',title:'Being Packed',desc:'Your snacks are being packed',prog:'55%',step:2},
  delivering:{emoji:'🛵',title:'On Its Way!',desc:'Your delivery is heading to you',prog:'80%',step:3},
  delivered:{emoji:'🎉',title:'Delivered!',desc:'Enjoy your snacks!',prog:'100%',step:4},
};
let cdInterval=null;

function renderTracking(){
  if(cdInterval){clearInterval(cdInterval);cdInterval=null;}
  if(!APP.activeOrderId&&!APP.orderNum){
    document.getElementById('tracking-no-order').style.display='block';
    document.getElementById('tracking-active').style.display='none';
    return;
  }
  document.getElementById('tracking-no-order').style.display='none';
  document.getElementById('tracking-active').style.display='block';
  if(APP.orderNum)document.getElementById('track-order-num').textContent=APP.orderNum;
  if(APP.activeOrderId){
    if(APP.activeOrderUnsub)APP.activeOrderUnsub();
    APP.activeOrderUnsub=db.collection('orders').doc(APP.activeOrderId).onSnapshot(doc=>{
      if(!doc.exists)return;
      updateTrackingUI(doc.data());
    },err=>console.error('Order live:',err));
  }
}

function showEtaSkeleton(){
  const box=document.getElementById('t-eta-box');
  box.classList.add('eta-pending');
  document.getElementById('t-eta-left').innerHTML=`<div class="eta-lbl">ARRIVING AROUND</div><div class="eta-skeleton"><div class="eta-skel-line wide"></div><div class="eta-skel-line narrow"></div></div><div class="eta-pending-label">Admin is setting your ETA…</div>`;
  document.getElementById('t-eta-right').innerHTML=`<div class="eta-cd-lbl">Time remaining</div><div class="eta-cd" style="color:var(--dim);">--:--</div>`;
}

function showEtaLive(eta){
  if(cdInterval){clearInterval(cdInterval);cdInterval=null;}
  const box=document.getElementById('t-eta-box');
  box.classList.remove('eta-pending');
  document.getElementById('t-eta-left').innerHTML=`<div class="eta-lbl">ARRIVING AROUND</div><div class="eta-t">${eta.toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'})}</div>`;
  document.getElementById('t-eta-right').innerHTML=`<div class="eta-cd-lbl">Time remaining</div><div class="eta-cd" id="t-countdown">--:--</div>`;
  let sec=Math.max(0,Math.floor((eta-new Date())/1000));
  const tick=()=>{const m=Math.floor(sec/60),s=sec%60;const el=document.getElementById('t-countdown');if(el)el.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');if(sec>0)sec--;};
  tick();cdInterval=setInterval(tick,1000);
}

function updateTrackingUI(data){
  const cfg=STATUS_CONFIG[data.status]||STATUS_CONFIG.pending;
  document.getElementById('t-emoji').textContent=cfg.emoji;
  document.getElementById('t-title').textContent=cfg.title;
  document.getElementById('t-desc').textContent=cfg.desc;
  document.getElementById('t-prog').style.width=cfg.prog;
  for(let i=0;i<5;i++){const dot=document.getElementById('td-'+i);const lbl=document.getElementById('tl-'+i);dot.className='step-dot';lbl.className='step-label';if(i<cfg.step){dot.classList.add('done');dot.textContent='✓';lbl.classList.add('done-lbl');}else if(i===cfg.step){dot.classList.add('current');dot.textContent=(['📦','✅','📦','🛵','🎉'])[i];lbl.classList.add('current-lbl');}else{dot.textContent=i+1;}}
  const etaStr=data.adminEta||null;
  if(etaStr){const eta=new Date(etaStr);if(!isNaN(eta.getTime()))showEtaLive(eta);else showEtaSkeleton();}else{showEtaSkeleton();}
  const items=(data.items&&data.items.length)?data.items:[{emoji:'🍜',name:'Your snacks',price:0,qty:1}];
  document.getElementById('tracking-items').innerHTML=items.map(i=>`<div class="ord-item"><div class="ord-thumb">${i.imageUrl?`<img src="${esc(i.imageUrl)}" alt="${esc(i.name)}">`:`<span style="font-size:18px">${esc(i.emoji)||'🍬'}</span>`}</div><div class="ord-name">${esc(i.name)} × ${i.qty}</div><div class="ord-price">R${esc(i.price*i.qty)}</div></div>`).join('')+`<div class="ord-item" style="background:var(--s2)"><span style="flex:1;font-size:12px;font-weight:700">Total paid</span><div class="ord-price">R${data.total||0}</div></div>`;
  document.getElementById('track-time').textContent=data.createdAt?.toDate?'Placed '+data.createdAt.toDate().toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'}):'—';
}

/* ── ADMIN PANEL ──────────────────────────────────────────── */
function setAdminTab(tab){
  document.getElementById('atab-products').classList.toggle('active',tab==='products');
  document.getElementById('atab-orders').classList.toggle('active',tab==='orders');
  document.getElementById('admin-products-content').style.display=tab==='products'?'block':'none';
  document.getElementById('admin-orders-content').style.display=tab==='orders'?'block':'none';
  if(tab==='orders'){startOrdersListener();renderAdminOrders();}
}
function renderAdminPanel(){
  const prods=APP.products;
  document.getElementById('stat-total').textContent=prods.length;
  document.getElementById('stat-instock').textContent=prods.filter(p=>p.inStock!==false).length;
  document.getElementById('stat-hot').textContent=prods.filter(p=>p.isHot).length;
  if(!prods.length){document.getElementById('admin-product-list').innerHTML='<div class="empty-state"><span class="empty-state-icon">📦</span><div class="empty-state-title">No products yet</div><div class="empty-state-sub">Click "Add New Product" to add your first snack.</div></div>';return;}
  document.getElementById('admin-product-list').innerHTML='<div class="admin-products-grid">'+prods.map(p=>{
    const img=p.imageUrl?`<img src="${esc(p.imageUrl)}" alt="${esc(p.name)}">`:`<span style="font-size:36px">${esc(p.emoji)||'🍬'}</span>`;
    const bg=p.imageUrl?'':`style="background:${getCatBg(p.category)}"`;
    const stockQty=p.stockQty!==undefined&&p.stockQty!==null?p.stockQty:'?';
    return `<div class="admin-prod-card"><div class="admin-prod-img" ${bg}>${img}</div><div class="admin-prod-info"><div class="admin-prod-brand">${esc(p.brand)}</div><div class="admin-prod-name">${esc(p.name)}</div><div class="admin-prod-price">R${esc(p.price)}</div></div><div class="admin-prod-controls"><button class="toggle-pill ${p.isHot?'on-hot':''}" onclick="toggleProductField('${esc(p.id)}','isHot',${!!p.isHot})">${p.isHot?'🔥 HOT':'HOT: off'}</button><button class="toggle-pill ${p.inStock!==false?'on-stock':''}" onclick="toggleProductField('${esc(p.id)}','inStock',${p.inStock!==false})">${p.inStock!==false?'✓ IN STOCK':'OUT'}</button><button class="admin-del-btn" onclick="deleteProduct('${esc(p.id)}')">🗑</button></div><div style="padding:0 10px 10px;"><div class="stock-ctrl"><span class="stock-ctrl-label">QTY:</span><input class="stock-num-input" type="number" min="0" value="${stockQty}" id="stock-inp-${esc(p.id)}" placeholder="0"><button class="stock-save-btn" onclick="saveStockQty('${esc(p.id)}')">Save</button></div></div></div>`;
  }).join('')+'</div>';
}
function saveStockQty(id){const inp=document.getElementById('stock-inp-'+id);if(!inp)return;const qty=parseInt(inp.value,10);if(isNaN(qty)||qty<0)return;db.collection('products').doc(id).update({stockQty:qty,inStock:qty>0}).catch(err=>alert('Update failed: '+err.message));}
function toggleProductField(id,field,currentVal){db.collection('products').doc(id).update({[field]:!currentVal}).catch(err=>alert('Update failed: '+err.message));}
function deleteProduct(id){if(!confirm('Delete this product?'))return;db.collection('products').doc(id).delete().catch(err=>alert('Delete failed: '+err.message));}

/* ── ADMIN ORDERS ─────────────────────────────────────────── */
let adminOrdersUnsub=null,APP_ORDERS_FILTER='all';
const expandedOrders=new Set();
const ORDER_STATUS_NEXT={pending:'confirmed',confirmed:'packing',packing:'delivering',delivering:'delivered',delivered:null};
const ORDER_STATUS_LABELS={pending:'⏳ PENDING',confirmed:'✓ CONFIRMED',packing:'📦 PACKING',delivering:'🛵 DELIVERING',delivered:'✅ DELIVERED'};
const ORDER_STATUS_CSS={pending:'status-pending',confirmed:'status-confirmed',packing:'status-packing',delivering:'status-delivering',delivered:'status-delivered'};
const ORDER_NEXT_LABELS={pending:'Confirm Order',confirmed:'Start Packing',packing:'Out for Delivery',delivering:'Mark Delivered'};
function orderAccent(id){let h=0;for(let i=0;i<id.length;i++)h=id.charCodeAt(i)+((h<<5)-h);const palette=['#C084FC','#F472B6','#34D399','#FCD34D','#60A5FA','#F97316','#A78BFA','#2DD4BF','#FB7185','#4ADE80'];return palette[Math.abs(h)%palette.length];}
function getInitials(name){if(!name||!name.trim())return '?';if(name.includes('@'))return name.split('@')[0].slice(0,2).toUpperCase();const parts=name.trim().split(/\s+/);if(parts.length>=2)return (parts[0][0]+parts[parts.length-1][0]).toUpperCase();return name.trim().slice(0,2).toUpperCase();}
function startOrdersListener(){if(adminOrdersUnsub)return;adminOrdersUnsub=db.collection('orders').orderBy('createdAt','desc').limit(100).onSnapshot(snapshot=>{APP.orders=snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));if(currentScreen==='admin')renderAdminOrders();},err=>console.error('Orders listener:',err));}
function setOrdersFilter(filter,el){APP_ORDERS_FILTER=filter;document.querySelectorAll('.orders-filter-chip').forEach(c=>c.classList.remove('active'));el.classList.add('active');renderAdminOrders();}
function toggleOrderCard(orderId){if(expandedOrders.has(orderId))expandedOrders.delete(orderId);else expandedOrders.add(orderId);const card=document.getElementById('ocard-'+orderId);if(card)card.classList.toggle('expanded',expandedOrders.has(orderId));}

function renderAdminOrders(){
  const allOrders=APP.orders||[];
  const delivered=allOrders.filter(o=>o.status==='delivered');
  const revenue=delivered.reduce((a,o)=>a+(o.total||0),0);
  const pending=allOrders.filter(o=>o.status!=='delivered').length;
  document.getElementById('stat-orders').textContent=allOrders.length;
  document.getElementById('stat-revenue').textContent='R'+revenue;
  const tab=document.getElementById('atab-orders');
  tab.textContent=pending?'Orders ('+pending+')':'Orders';
  let orders=allOrders;
  if(APP_ORDERS_FILTER!=='all')orders=orders.filter(o=>o.status===APP_ORDERS_FILTER);
  const container=document.getElementById('admin-order-list');
  if(!orders.length){container.innerHTML=`<div class="empty-state"><span class="empty-state-icon">📭</span><div class="empty-state-title">${APP_ORDERS_FILTER!=='all'?'No orders here':'No orders yet'}</div></div>`;return;}
  container.innerHTML=orders.map(o=>{
    const accent=orderAccent(o.id);
    const initials=getInitials(o.userDisplayName||o.userEmail||'?');
    const t=o.createdAt?.toDate?o.createdAt.toDate():new Date();
    const timeStr=t.toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'})+', '+t.toLocaleDateString('en-ZA',{day:'numeric',month:'short'});
    const campusLabel=o.campus==='upper'?'🏛 Upper':'📚 Middle';
    const next=ORDER_STATUS_NEXT[o.status];
    const isExpanded=expandedOrders.has(o.id);
    const adminEtaTime=o.adminEtaTime||'';
    const currentEtaDisplay=o.adminEta?new Date(o.adminEta).toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'}):'Not set';
    const emojiPills=(o.items||[]).slice(0,4).map(i=>`<span class="ocs-emoji-pill">${i.imageUrl?'📦':(i.emoji||'🍬')} ×${i.qty}</span>`).join('');
    const extraPill=(o.items||[]).length>4?`<span class="ocs-emoji-pill">+${(o.items||[]).length-4} more</span>`:'';
    const itemRows=(o.items||[]).map(i=>`<div class="order-item-row"><span class="order-item-emoji">${i.imageUrl?`<img src="${esc(i.imageUrl)}" style="width:20px;height:20px;border-radius:4px;object-fit:cover;" alt="">`:(esc(i.emoji)||'🍬')}</span><span class="order-item-name">${esc(i.name)}</span><span class="order-item-qty">×${i.qty}</span><span class="order-item-price">R${esc(i.price*i.qty)}</span></div>`).join('');
    return `<div class="order-card${isExpanded?' expanded':''}" id="ocard-${esc(o.id)}" style="--order-accent:${accent}">
      <div class="order-card-summary" onclick="toggleOrderCard('${esc(o.id)}')">
        <div class="ocs-initials" style="background:${accent}">${esc(initials)}</div>
        <div class="ocs-left">
          <div class="ocs-num">${esc(o.orderNum||'—')}</div>
          <div class="ocs-emoji-strip">${emojiPills}${extraPill}</div>
          <div class="ocs-meta">${campusLabel}${o.residence?' · '+esc(o.residence):''} · ${timeStr}</div>
        </div>
        <div class="ocs-right">
          <span class="order-status-badge ${ORDER_STATUS_CSS[o.status]||''}">${ORDER_STATUS_LABELS[o.status]||esc(o.status)}</span>
          <span class="ocs-total">R${esc(o.total||0)}</span>
          <span class="ocs-chevron">▼</span>
        </div>
      </div>
      <div class="order-card-body">
        <div class="order-body-inner">
          <div class="order-customer">👤 <b>${esc(o.userDisplayName||'Guest')}</b><br>${o.userEmail?`📧 ${esc(o.userEmail)}<br>`:''}${o.phone?`📱 ${esc(o.phone)}<br>`:''}${campusLabel}${o.residence?' · '+esc(o.residence):''}${o.deliveryTimeMode==='sched'&&o.scheduledTime?`<br>🗓️ Scheduled for ${esc(o.scheduledTime)}`:''}</div>
          <div class="order-items-list">${itemRows||'<div class="order-item-row"><span class="order-item-name" style="color:var(--muted)">No items</span></div>'}</div>
          <div class="order-totals-row"><span>Subtotal</span><span>R${esc(o.subtotal||o.total||0)}</span></div>
          <div class="order-totals-row"><span>Delivery</span><span style="color:var(--candy-mint)">FREE</span></div>
          <hr class="order-divider">
          <div class="order-totals-row big"><span>Total</span><span style="color:var(--lav)">R${esc(o.total||0)}</span></div>
          <div class="eta-set-row">
            <span class="eta-set-label">🕐 SET ETA</span>
            <input class="eta-set-input" type="time" id="eta-inp-${esc(o.id)}" value="${adminEtaTime}">
            <button class="eta-set-btn" onclick="setAdminEta('${esc(o.id)}')">Send</button>
          </div>
          <div class="eta-current-val">Currently: <b style="color:${accent}">${currentEtaDisplay}</b></div>
          <div class="order-card-actions">
            <span style="font-size:11px;color:var(--muted);">${timeStr}</span>
            ${next?`<button class="order-action-btn" style="background:linear-gradient(135deg,${accent}cc,${accent})" onclick="advanceOrder('${esc(o.id)}','${next}')">${ORDER_NEXT_LABELS[o.status]} →</button>`:`<span class="order-complete-tag">✅ COMPLETE</span>`}
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function advanceOrder(orderId,newStatus){db.collection('orders').doc(orderId).update({status:newStatus}).catch(err=>alert('Update failed: '+err.message));}
function setAdminEta(orderId){const inp=document.getElementById('eta-inp-'+orderId);if(!inp||!inp.value)return;const[h,m]=inp.value.split(':').map(Number);const eta=new Date();eta.setHours(h,m,0,0);if(eta<new Date())eta.setDate(eta.getDate()+1);db.collection('orders').doc(orderId).update({adminEta:eta.toISOString(),adminEtaTime:inp.value}).catch(err=>alert('ETA update failed: '+err.message));}

/* ── DRAWER ───────────────────────────────────────────────── */
function openDrawer(){document.getElementById('add-product-drawer').classList.add('open');document.getElementById('drawer-overlay').classList.add('show');APP.pendingImageUrl=null;document.getElementById('upload-preview').style.display='none';document.getElementById('upload-area').style.display='block';['p-name','p-brand','p-emoji'].forEach(id=>document.getElementById(id).value='');document.getElementById('p-category').value='';document.getElementById('p-price').value='';document.getElementById('p-stock').value='';document.getElementById('p-hot').checked=false;document.getElementById('drawer-error').style.display='none';document.getElementById('save-product-btn').disabled=false;document.getElementById('save-product-btn').textContent='Save Product';document.getElementById('upload-spinner').style.display='none';document.getElementById('upload-progress').style.display='none';}
function closeDrawer(){document.getElementById('add-product-drawer').classList.remove('open');document.getElementById('drawer-overlay').classList.remove('show');}
function handleFileSelect(input){const file=input.files[0];if(!file)return;if(file.size>5*1024*1024){alert('Image must be under 5MB');return;}const reader=new FileReader();reader.onload=e=>{const preview=document.getElementById('upload-preview');preview.src=e.target.result;preview.style.display='block';document.getElementById('upload-area').style.display='none';};reader.readAsDataURL(file);uploadImageToStorage(file);}
function uploadImageToStorage(file){const spinner=document.getElementById('upload-spinner'),progressWrap=document.getElementById('upload-progress'),progressBar=document.getElementById('upload-progress-bar');spinner.style.display='block';progressWrap.style.display='block';spinner.textContent='⏳ Uploading image...';const ref=storage.ref('products/'+Date.now()+'_'+file.name),task=ref.put(file);task.on('state_changed',snap=>{progressBar.style.width=(snap.bytesTransferred/snap.totalBytes*100)+'%';},err=>{spinner.textContent='❌ Upload failed: '+err.message;APP.pendingImageUrl=null;},()=>{task.snapshot.ref.getDownloadURL().then(url=>{APP.pendingImageUrl=url;spinner.textContent='✅ Image ready';progressWrap.style.display='none';});});}
function saveProduct(){const name=document.getElementById('p-name').value.trim(),category=document.getElementById('p-category').value,price=parseFloat(document.getElementById('p-price').value),stockQty=parseInt(document.getElementById('p-stock').value,10);const errEl=document.getElementById('drawer-error');if(!name||!category||!price||price<1||isNaN(stockQty)||stockQty<0){errEl.textContent='Please fill in Name, Category, Price, and Stock Qty.';errEl.style.display='block';return;}const btn=document.getElementById('save-product-btn');btn.disabled=true;btn.textContent='Saving…';db.collection('products').add({name,category,price,brand:document.getElementById('p-brand').value.trim()||'',emoji:document.getElementById('p-emoji').value.trim()||getDefaultEmoji(category),imageUrl:APP.pendingImageUrl||'',isHot:document.getElementById('p-hot').checked,inStock:stockQty>0,stockQty,createdAt:firebase.firestore.FieldValue.serverTimestamp()}).then(()=>{closeDrawer();APP.pendingImageUrl=null;}).catch(err=>{errEl.textContent='Save failed: '+err.message;errEl.style.display='block';btn.disabled=false;btn.textContent='Save Product';});}
function getDefaultEmoji(cat){return{chips:'🥔',drinks:'⚡',sweets:'🍫',meals:'🍜'}[cat]||'🍬';}

/* ── INIT ─────────────────────────────────────────────────── */
setCampus('upper');
