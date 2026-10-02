/* La Propia Pizzería — prototipo web para propuesta comercial.
   Sin backend: carta inicial de Rappi; administración local solo de prueba.
   Con Supabase configurado: carta, imágenes, promociones y ajustes persistentes. */
(() => {
  'use strict';
  const CONFIG = window.LA_PROPIA_CONFIG || {};
  const KEYS = {cart:'lp_cart_pdf_v2',products:'lp_products_pdf_v2',settings:'lp_settings_preview_v1',promotions:'lp_promotions_preview_v1',analytics:'lp_analytics_consent_v1'};
  const $ = (sel, parent=document) => parent.querySelector(sel);
  const $$ = (sel, parent=document) => [...parent.querySelectorAll(sel)];
  const money = new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0});
  const normalise = str => String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = url => {try {let u=new URL(url,location.href);return ['https:','http:'].includes(u.protocol) ? u.href : ''}catch{return ''}};
  const fromStorage = (key, fallback) => {try {const str=localStorage.getItem(key);return str===null ? fallback : JSON.parse(str)}catch{return fallback}};
  const store = (key, value) => {try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
  const track = (event, data={}) => {if(window.LP_ANALYTICS_READY && typeof window.gtag==='function')window.gtag('event',event,data)};
  const state={products:[],promotions:[],settings:{},category:'Todos',search:'',limit:12,cart:fromStorage(KEYS.cart,{}),supabase:null,lastActive:null,modalMessage:''};
  function applySettings(){
    const local=fromStorage(KEYS.settings,{});
    state.settings={...CONFIG,...local,...state.settings};
    const s=state.settings;
    $('#businessAddress').textContent=s.address || CONFIG.address;
    const phone=s.whatsapp || CONFIG.whatsapp;
    $('#businessPhone').textContent=phone.replace(/^57/,'+57 ').replace(/^(\+57 \d{3})(\d{3})(\d{4})$/,'$1 $2 $3');
    $('#businessPhone').href=`tel:+${phone.replace(/\D/g,'')}`;
    $('#mapLink').href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(s.address||CONFIG.address);
    $('#igLink').href=$('#footerIg').href=safeUrl(s.instagram||CONFIG.instagram);
    $('#officialMenu').href=$('#footerMenu').href=safeUrl(s.officialMenu||CONFIG.officialMenu);
    const heroImg=$('#heroPhotoImg');const selectedHero=(s.heroImage==='assets/carta/la-patrona.webp')?CONFIG.heroImage:(s.heroImage||CONFIG.heroImage);heroImg.src=selectedHero;
    heroImg.onerror=function(){this.onerror=null;this.src='assets/pizza-art.svg';this.alt='Ilustración de pizza artesanal (imagen de respaldo)';};
    const old=$('#sitePromotion');if(old)old.remove();
    if(s.promotionText && s.promotionEnabled){
      const promo=document.createElement('div');promo.id='sitePromotion';promo.className='site-promotion';
      promo.textContent=s.promotionText;
      $('#siteHeader').after(promo);
    }
  }
  const validProduct=p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&Number.isFinite(Number(p.price));
  function formatProduct(p){return {...p,price:Number(p.price),available:p.available!==false,image:p.image_url||p.image||'',featured:!!p.featured};}
  async function loadData(){
    const seed=Array.isArray(window.LP_SEED_PRODUCTS)?window.LP_SEED_PRODUCTS:[];
    state.products=fromStorage(KEYS.products,seed).filter(validProduct).map(formatProduct);
    state.promotions=fromStorage(KEYS.promotions,window.LP_SEED_PROMOTIONS||[]);
    if(CONFIG.supabaseUrl&&CONFIG.supabaseAnonKey){
      try{
        const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        state.supabase=createClient(CONFIG.supabaseUrl,CONFIG.supabaseAnonKey);
        const [p,s,pr]=await Promise.all([
          state.supabase.from('products').select('*').order('sort_order'),
          state.supabase.from('site_settings').select('key,value'),
          state.supabase.from('promotions').select('*').eq('active',true).order('sort_order')
        ]);
        if(p.error)throw p.error;
        if(Array.isArray(p.data)&&p.data.length)state.products=p.data.filter(validProduct).map(formatProduct);
        if(!s.error&&s.data){for(const row of s.data){if(row.key==='site'&&row.value&&typeof row.value==='object')Object.assign(state.settings,row.value);}}
        if(!pr.error&&pr.data)state.promotions=pr.data;
      }catch(err){console.warn('No se pudo cargar Supabase. Mostrando carta de demostración.',err)}
    }
    applySettings();renderCategories();renderFeatured();renderMenu();renderCart();setupPromos();
  }
  function setupPromos(){
    const active=state.promotions.find(p=>p.active!==false&&p.title);
    if(!active)return;
    const banner=document.createElement('aside');banner.className='promotional-alert';banner.innerHTML=`<span>${escapeHTML(active.title)}</span> ${active.description?`<small>${escapeHTML(active.description)}</small>`:''}`;
    $('#featuredGrid').before(banner);
  }
  function cardImage(p,featured=false){
    const url=safeUrl(p.image||p.image_url);
    const html=url?`<img src="${escapeHTML(url)}" alt="${escapeHTML(p.name)}" loading="lazy" decoding="async" onerror="this.classList.add('failed')">`:'';
    return featured?`<div class="featured-media">${html}${p.badge?`<span class="featured-badge">${escapeHTML(p.badge)}</span>`:''}</div>`:`<div class="menu-media ${/pizza/i.test(p.category)?'':'non-pizza'}"><span class="product-no-image" aria-hidden="true">${/pizza/i.test(p.category)?'HECHA CON ANTOJO ✳':escapeHTML(p.category.toUpperCase())+' ✳'}</span>${html}</div>`;
  }
  function variantPicker(p){
    if(!Array.isArray(p.variants)||!p.variants.length)return '';
    return `<label class="pizza-size-label">Elige tu tamaño<select class="pizza-size-select" aria-label="Tamaño de ${escapeHTML(p.name)}">${p.variants.map((v,i)=>`<option value="${i}">${escapeHTML(v.name)} · ${money.format(v.price)}</option>`).join('')}</select></label>`;
  }
  function renderFeatured(){
    const choices=state.products.filter(p=>p.featured&&p.available).slice(0,5);
    $('#featuredGrid').innerHTML=choices.map((p,i)=>`<article class="featured-card">${cardImage(p,true)}<div class="featured-body"><span class="featured-cat">${escapeHTML(p.category)}</span><h3>${escapeHTML(p.name)}</h3><p>${escapeHTML(p.description)}</p>${variantPicker(p)}<div class="featured-bottom"><strong class="card-live-price">${money.format(p.price)}</strong><button class="round-add" data-add="${escapeHTML(p.id)}" title="Agregar ${escapeHTML(p.name)}" aria-label="Agregar ${escapeHTML(p.name)} al carrito">+</button></div></div></article>`).join('');
    if(!choices.length)$('#featuredGrid').closest('.feature-section').hidden=true;
  }
  function renderCategories(){
    const cats=['Todos',...new Set(state.products.filter(p=>p.available).map(p=>p.category))];
    $('#categoryTabs').innerHTML=cats.map((cat,i)=>`<button type="button" class="category-tab" role="tab" aria-selected="${state.category===cat}" tabindex="${state.category===cat?0:-1}" data-category="${escapeHTML(cat)}">${escapeHTML(cat)}</button>`).join('');
  }
  function filteredProducts(){return state.products.filter(p=>p.available&&(state.category==='Todos'||p.category===state.category)&&(!state.search||normalise(`${p.name} ${p.description} ${p.category}`).includes(normalise(state.search))))}
  function renderMenu(){
    const list=filteredProducts();const visible=list.slice(0,state.limit);
    $('#menuGrid').innerHTML=visible.length?visible.map(p=>`<article class="menu-card">${cardImage(p)}<div class="menu-body"><span class="menu-card-cat">${escapeHTML(p.category)}</span><h3>${escapeHTML(p.name)}</h3><p class="menu-description">${escapeHTML(p.description)}</p>${variantPicker(p)}<div class="menu-card-bottom"><strong class="card-live-price">${money.format(p.price)}</strong><button class="menu-add" type="button" data-add="${escapeHTML(p.id)}" aria-label="Agregar ${escapeHTML(p.name)}" title="Agregar al pedido">+</button></div></div></article>`).join(''):`<div class="empty-search"><strong>¿Algo más se te antoja?</strong><p>No encontramos platos con esos filtros. Prueba otra categoría.</p></div>`;
    $('#menuResults').textContent=`${list.length} ${list.length===1?'producto':'productos'}${state.category==='Todos'?'':' · '+state.category}`;
    $('#resetFilters').hidden=state.category==='Todos'&&!state.search;
    $('#loadMoreWrap').hidden=state.limit>=list.length;
  }
  function addProduct(id,button){
    const product=state.products.find(p=>p.id===id&&p.available);if(!product)return;
    const chosen=button?.closest('.featured-card,.menu-card')?.querySelector('.pizza-size-select');
    const option=chosen?Number(chosen.value):0;
    const index=Array.isArray(product.variants)&&product.variants.length?Math.max(0,Math.min(option,product.variants.length-1)):null;
    const price=index!==null?Number(product.variants[index].price):product.price;
    const key=index===null?id:`${id}::${index}`;
    state.cart[key]=Math.min(99,(Number(state.cart[key])||0)+1);
    saveCart();renderCart();track('add_to_cart',{currency:'COP',value:price,items:[{item_id:key,item_name:product.name,price}]});
    if(button){const old=button.textContent;button.textContent='✓';setTimeout(()=>button.textContent=old,750)}
  }
  function saveCart(){store(KEYS.cart,state.cart)}
  function cartItems(){return Object.entries(state.cart).map(([key,count])=>{
    const [id,indexString]=key.split('::');const base=state.products.find(p=>p.id===id&&p.available);
    if(!base)return {key,product:null,qty:Number(count)};
    const variant=indexString!==undefined&&Array.isArray(base.variants)?base.variants[Number(indexString)]:null;
    const product=variant?{...base,name:`${base.name} (${variant.name})`,price:Number(variant.price)}:base;
    return {key,product,qty:Number(count)};
  }).filter(x=>x.product&&x.qty>0)}
  function renderCart(){
    const entries=cartItems();const qty=entries.reduce((sum,x)=>sum+x.qty,0);
    const total=entries.reduce((sum,x)=>sum+x.qty*x.product.price,0);
    $('#cartCount').textContent=qty;$('#floatingTotal').textContent=money.format(total);
    $('#floatingCart').hidden=qty===0;
    $('#cartItems').innerHTML=entries.map(({product:p,qty:n,key})=>`<div class="cart-item"><img class="cart-item-img" src="${escapeHTML(safeUrl(p.image)||'assets/pizza-art.svg')}" onerror="this.onerror=null;this.src='../assets/pizza-art.svg'.replace('../','')" alt="${escapeHTML(p.name)}" loading="lazy"><div class="cart-item-main"><div class="cart-item-name">${escapeHTML(p.name)}</div><div class="cart-item-price">${money.format(p.price*n)}</div><div class="qty-control"><button type="button" data-qty="${escapeHTML(key)}" data-delta="-1" aria-label="Quitar una unidad de ${escapeHTML(p.name)}">−</button><output aria-label="Cantidad">${n}</output><button type="button" data-qty="${escapeHTML(key)}" data-delta="1" aria-label="Añadir una unidad de ${escapeHTML(p.name)}">+</button></div></div><button type="button" class="remove-item" data-remove="${escapeHTML(key)}" aria-label="Eliminar ${escapeHTML(p.name)}">×</button></div>`).join('');
    $('#cartSubtotal').textContent=money.format(total);
    $('#emptyCart').hidden=qty>0;$('#cartFooter').hidden=qty===0;$('#checkoutBtn').disabled=qty===0;
    $('#demoCheckoutNotice').textContent=CONFIG.demoMode?'MODO DEMO: no se envían pedidos reales.':'Te dirigiremos a WhatsApp para solicitar confirmación.';
  }
  function openCart(){state.lastActive=document.activeElement;$('#drawerBackdrop').hidden=false;$('#cartDrawer').classList.add('open');$('#cartDrawer').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('#closeCart').focus();track('view_cart')}
  function closeCart(){ $('#cartDrawer').classList.remove('open');$('#cartDrawer').setAttribute('aria-hidden','true');$('#drawerBackdrop').hidden=true;document.body.style.overflow='';state.lastActive?.focus?.();}
  function modalMessage(title,text,explain){
    state.modalMessage=text;$('#messageTitle').textContent=title;$('#messageText').textContent=text;$('#messageExplain').textContent=explain;
    $('#messageModal').hidden=false;state.lastActive=document.activeElement;document.body.style.overflow='hidden';$('#copyMessage').focus();
  }
  function closeModal(){ $('#messageModal').hidden=true;document.body.style.overflow='';state.lastActive?.focus?.()}
  function sendWhatsApp(phone,text,title){
    if(CONFIG.demoMode){modalMessage(title,text,'Esta es una demostración: puedes copiar el mensaje, pero no se enviará al negocio.');return}
    const link=`https://wa.me/${String(phone).replace(/\D/g,'')}?text=${encodeURIComponent(text)}`;
    window.open(link,'_blank','noopener,noreferrer');
  }
  function checkout(){
    const items=cartItems();if(!items.length)return;
    const method=$('input[name="orderMethod"]:checked')?.value||'Recoger en el local';
    const note=$('#orderNote').value.trim();const sum=items.reduce((total,x)=>total+x.product.price*x.qty,0);
    const rows=items.map(({product:p,qty})=>`• ${qty} × ${p.name} — ${money.format(p.price*qty)}`);
    const text=[`¡Hola, La Propia! 🍕 Quisiera consultar por este pedido:`,...rows,``,`Subtotal de referencia: ${money.format(sum)}`,`Modalidad: ${method}`,...(note?[`Indicaciones: ${note}`]:[]),``,`¿Me confirman disponibilidad, precio final, tiempo de entrega y forma de pago?`].join('\n');
    track('begin_checkout',{currency:'COP',value:sum,items:items.map(({product:p,qty})=>({item_id:p.id,item_name:p.name,quantity:qty,price:p.price}))});
    sendWhatsApp(state.settings.whatsapp||CONFIG.whatsapp,text,'Tu pedido está listo');
  }
  const localYMD=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function makeReservation(e){
    e.preventDefault();const name=$('#resName').value.trim();const date=$('#resDate').value;const time=$('#resTime').value;
    const people=$('#resPeople').value;const notes=$('#resNotes').value.trim();
    if(!name||!date||!time||!people)return;
    if(date<localYMD(new Date())){alert('Elige una fecha de hoy en adelante.');return}
    const text=[`¡Hola, La Propia! 🍕 Quisiera solicitar una reserva.`,``,`Nombre: ${name}`,`Personas: ${people}`,`Fecha: ${date}`,`Hora solicitada: ${time}`,...(notes?[`Comentarios: ${notes}`]:[]),``,`¿Me confirman si hay disponibilidad?`].join('\n');
    track('request_reservation',{people});sendWhatsApp(state.settings.reservationWhatsapp||CONFIG.reservationWhatsapp||CONFIG.whatsapp,text,'¡Tu solicitud está lista!');
  }
  function setupInteractions(){
    $('#openCart').addEventListener('click',openCart);$('#floatingCart').addEventListener('click',openCart);
    $('#closeCart').addEventListener('click',closeCart);$('#drawerBackdrop').addEventListener('click',closeCart);
    $('#continueShopping').addEventListener('click',()=>{closeCart();location.hash='#carta'});
    $('#checkoutBtn').addEventListener('click',checkout);$('#reservationForm').addEventListener('submit',makeReservation);
    $('#closeModal').addEventListener('click',closeModal);$('#modalOkay').addEventListener('click',closeModal);
    $('#messageModal').addEventListener('click',e=>{if(e.target===$('#messageModal'))closeModal()});
    $('#copyMessage').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(state.modalMessage);$('#copyMessage').textContent='¡Copiado!'}catch{const area=document.createElement('textarea');area.value=state.modalMessage;document.body.append(area);area.select();document.execCommand('copy');area.remove();$('#copyMessage').textContent='¡Copiado!'}setTimeout(()=>$('#copyMessage').textContent='Copiar mensaje',1800)});
    document.addEventListener('click',e=>{const add=e.target.closest('[data-add]');if(add){addProduct(add.dataset.add,add);return}const rm=e.target.closest('[data-remove]');if(rm){delete state.cart[rm.dataset.remove];saveCart();renderCart();return}const qty=e.target.closest('[data-qty]');if(qty){const id=qty.dataset.qty;state.cart[id]=Math.max(0,Math.min(99,(Number(state.cart[id])||0)+Number(qty.dataset.delta)));if(!state.cart[id])delete state.cart[id];saveCart();renderCart();return}const cat=e.target.closest('[data-category]');if(cat){state.category=cat.dataset.category;state.limit=12;renderCategories();renderMenu();track('menu_category',{category:state.category});return}});
    document.addEventListener('change',e=>{if(e.target.matches('.pizza-size-select')){const card=e.target.closest('.featured-card,.menu-card');const price=Number(e.target.selectedOptions[0]?.textContent.match(/\$[\d.]+/)?.[0].replace(/[^\d]/g,''))||null;const label=card?.querySelector('.card-live-price');if(label&&price)label.textContent=money.format(price);}});
    $('#menuSearch').addEventListener('input',e=>{state.search=e.target.value.trim();state.limit=12;renderMenu()});
    $('#resetFilters').addEventListener('click',()=>{state.category='Todos';state.search='';state.limit=12;$('#menuSearch').value='';renderCategories();renderMenu()});
    $('#loadMore').addEventListener('click',()=>{state.limit+=12;renderMenu()});
    $('#menuToggle').addEventListener('click',()=>{const nav=$('#mobileNav');nav.hidden=!nav.hidden;$('#menuToggle').setAttribute('aria-expanded',String(!nav.hidden))});
    $$('#mobileNav a').forEach(a=>a.addEventListener('click',()=>{$('#mobileNav').hidden=true;$('#menuToggle').setAttribute('aria-expanded','false')}));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#messageModal').hidden)closeModal();else if($('#cartDrawer').classList.contains('open'))closeCart();else{$('#mobileNav').hidden=true;$('#menuToggle').setAttribute('aria-expanded','false')}}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#menuSearch').focus();location.hash='#carta'}});
    const d=$('#resDate');d.min=localYMD(new Date());
    window.addEventListener('scroll',()=>$('#siteHeader').classList.toggle('scrolled',window.scrollY>24),{passive:true});
    if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}},{threshold:.1,rootMargin:'0px 0px 60px 0px'});$$('.reveal').forEach(el=>observer.observe(el))}else{$$('.reveal').forEach(e=>e.classList.add('visible'))}
  }
  function analytics(){
    if(!CONFIG.ga4MeasurementId)return;
    const consent=fromStorage(KEYS.analytics,null);
    const load=()=>{if(window.LP_ANALYTICS_READY)return;window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config',CONFIG.ga4MeasurementId,{anonymize_ip:true});let script=document.createElement('script');script.async=true;script.src=`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(CONFIG.ga4MeasurementId)}`;document.head.append(script);window.LP_ANALYTICS_READY=true};
    if(consent==='accepted'){load();return}if(consent==='rejected')return;
    const banner=$('#consentBanner');banner.hidden=false;
    $('#acceptAnalytics').addEventListener('click',()=>{store(KEYS.analytics,'accepted');banner.hidden=true;load()});
    $('#rejectAnalytics').addEventListener('click',()=>{store(KEYS.analytics,'rejected');banner.hidden=true});
  }
  setupInteractions();analytics();loadData();
})();
