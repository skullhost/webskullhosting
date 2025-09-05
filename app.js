/* app.js
   Final app: user + admin integrated with Supabase (realtime)
   IMPORTANT: replace SUPABASE_URL and SUPABASE_ANON_KEY below.
*/

const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co"; // <-- ganti
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";               // <-- ganti

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* -------------------- Shared helpers -------------------- */
function el(id){ return document.getElementById(id); }
function numberWithCommas(x){ return x?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") || x; }
function uid(prefix='id'){ return prefix + '_' + Math.random().toString(36).slice(2,9); }

/* -------------------- Client-side Cart (localStorage) -------------------- */
const CART_KEY = 'store_cart_v1';
function getCart(){
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  catch { return []; }
}
function saveCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); window.dispatchEvent(new Event('cart-changed')); }
function addToCart(productId){
  const cart = getCart();
  const found = cart.find(i=>i.productId===productId);
  if(found) found.qty++;
  else cart.push({ productId, qty: 1 });
  saveCart(cart);
}
function removeFromCart(productId){
  let cart = getCart();
  cart = cart.filter(i=>i.productId !== productId);
  saveCart(cart);
}
function clearCart(){ saveCart([]); }

/* -------------------- USER UI (index.html) -------------------- */
async function loadProductsToGrid(){
  const container = el('products');
  container.innerHTML = '<div class="empty">Memuat produk...</div>';
  const { data, error } = await supabase.from('products').select('*').order('name');
  if(error){ container.innerHTML = '<div class="empty">Gagal memuat produk.</div>'; console.error(error); return; }
  if(!data || data.length === 0){ container.innerHTML = '<div class="empty">Belum ada produk.</div>'; return; }

  container.innerHTML = '';
  data.forEach(p=>{
    const card = document.createElement('div'); card.className = 'card product-card';
    card.innerHTML = `
      <div class="product-img" style="background-image:url('${p.image || '/img/placeholder.png'}')"></div>
      <div class="card-body">
        <h3>${p.name}</h3>
        <p class="price">Rp ${numberWithCommas(p.price)}</p>
        <p class="desc">${p.description || ''}</p>
        <div class="product-actions">
          <button class="btn primary buy-btn" data-id="${p.id}">Buy</button>
          <button class="btn secondary cart-btn" data-id="${p.id}">Keranjang</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  // attach events
  document.querySelectorAll('.cart-btn').forEach(b=>{
    b.addEventListener('click', e=>{
      addToCart(e.currentTarget.dataset.id);
      refreshCartCount();
      alert('Produk ditambahkan ke keranjang.');
    });
  });
  document.querySelectorAll('.buy-btn').forEach(b=>{
    b.addEventListener('click', e=>{
      openModal({ type: 'buy', productId: e.currentTarget.dataset.id });
    });
  });
}

/* Cart UI */
function renderCart(){
  const list = el('cart-list');
  const cart = getCart();
  if(!list) return;
  if(cart.length === 0){ list.innerHTML = '<div class="empty">Keranjang kosong.</div>'; return; }

  // fetch product details for all items
  const productIds = cart.map(i=>i.productId);
  supabase.from('products').select('*').in('id', productIds).then(({data})=>{
    const map = {}; (data||[]).forEach(p=>map[p.id]=p);
    list.innerHTML = '';
    cart.forEach(item=>{
      const p = map[item.productId] || { name: '(produk dihapus)', image: '/img/placeholder.png', price: 0 };
      const elItem = document.createElement('div');
      elItem.className = 'cart-item';
      elItem.innerHTML = `
        <div class="cart-left">
          <div class="mini-img" style="background-image:url('${p.image}')"></div>
          <div>
            <strong>${p.name}</strong>
            <div class="muted">Rp ${numberWithCommas(p.price)} x ${item.qty}</div>
          </div>
        </div>
        <div class="cart-right">
          <button class="btn danger remove-cart" data-id="${item.productId}">Hapus</button>
        </div>`;
      list.appendChild(elItem);
    });
    list.querySelectorAll('.remove-cart').forEach(b=>{
      b.addEventListener('click', e=>{
        removeFromCart(e.currentTarget.dataset.id);
        renderCart();
        refreshCartCount();
      });
    });
  }).catch(err=>{ console.error(err); list.innerHTML = '<div class="empty">Gagal memuat item keranjang.</div>'; });
}

function refreshCartCount(){
  const cnt = getCart().reduce((s,i)=>s + (i.qty||0), 0);
  const elCount = el('cart-count');
  if(elCount) elCount.textContent = cnt;
}

/* History UI (filter by last used session store_last_user) */
async function renderHistory(){
  const list = el('history-list');
  const last = sessionStorage.getItem('store_last_user');
  if(!list) return;
  if(!last){ list.innerHTML = '<div class="empty">Belum ada pembelian. Gunakan Buy / Checkout.</div>'; return; }
  const u = JSON.parse(last);
  // fetch orders for username & phone
  const { data, error } = await supabase.from('orders').select('*').eq('username', u.username).eq('phone', u.phone).order('created_at', { ascending: false });
  if(error){ list.innerHTML = '<div class="empty">Gagal ambil history.</div>'; console.error(error); return; }
  if(!data || data.length === 0){ list.innerHTML = '<div class="empty">Belum ada pesanan untuk akun ini.</div>'; return; }

  // fetch product info for mapping
  const prodIds = Array.from(new Set(data.map(o=>o.product)));
  const { data: prods } = await supabase.from('products').select('*').in('id', prodIds);
  const map = {}; (prods||[]).forEach(p=>map[p.id]=p);

  list.innerHTML = '';
  data.forEach(o=>{
    const p = map[o.product] || { name: '(produk dihapus)' };
    const node = document.createElement('div');
    node.className = 'order-card';
    node.innerHTML = `
      <div><strong>${p.name}</strong></div>
      <div class="muted">User: ${o.username} — WA: ${o.phone}</div>
      <div class="muted">Tanggal: ${new Date(o.created_at||o.createdAt||o.createdAtTimestamp||Date.now()).toLocaleString()}</div>
      <div>Status: <span class="status ${o.status}">${o.status?.toUpperCase()}</span></div>
    `;
    list.appendChild(node);
  });
}

/* -------------------- Modal Buy / Checkout -------------------- */
const modal = { el: null, ctx: null };
function makeModal(){
  modal.el = document.getElementById('modal');
  if(!modal.el) return;
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-submit').addEventListener('click', async ()=>{
    const username = document.getElementById('modal-username').value.trim();
    const phone = document.getElementById('modal-phone').value.trim();
    if(!username || !phone){ alert('Isi username dan nomor WhatsApp.'); return; }
    sessionStorage.setItem('store_last_user', JSON.stringify({ username, phone }));

    if(modal.ctx.type === 'buy'){
      // single product
      const { error } = await supabase.from('orders').insert([{ username, phone, product: modal.ctx.productId, status: 'pending' }]);
      if(error){ alert('Gagal membuat pesanan.'); console.error(error); } else { alert('Pesanan terkirim. Admin akan menghubungi.'); }
    } else if(modal.ctx.type === 'checkout'){
      const cart = getCart();
      for(const item of cart){
        const { error } = await supabase.from('orders').insert([{ username, phone, product: item.productId, status: 'pending' }]);
        if(error) console.error('gagal insert order', error);
      }
      clearCart();
      refreshCartCount();
      renderCart();
      alert('Checkout selesai. Admin akan menghubungi.');
    }
    closeModal();
    // show history
    showSection('history');
    renderHistory();
  });
}
function openModal(ctx){
  modal.ctx = ctx;
  const title = ctx.type === 'buy' ? 'Pembelian Produk' : 'Checkout Keranjang';
  document.getElementById('modal-title').textContent = title;
  const last = sessionStorage.getItem('store_last_user');
  if(last){
    const u = JSON.parse(last);
    document.getElementById('modal-username').value = u.username;
    document.getElementById('modal-phone').value = u.phone;
  } else { document.getElementById('modal-username').value = ''; document.getElementById('modal-phone').value = ''; }
  modal.el.style.display = 'flex';
}
function closeModal(){ modal.el.style.display = 'none'; modal.ctx = null; }

/* -------------------- NAV / Router for index.html -------------------- */
function showSection(name){
  ['products','cart','history'].forEach(k=>{
    const elS = document.getElementById('page-'+k);
    if(elS) elS.style.display = (k===name) ? 'block' : 'none';
  });
  if(name === 'products') loadProductsToGrid();
  if(name === 'cart') renderCart();
  if(name === 'history') renderHistory();
}
document.addEventListener('DOMContentLoaded', ()=>{
  // only for pages that exist
  if(el('nav-products')) el('nav-products').addEventListener('click', ()=> showSection('products'));
  if(el('nav-cart')) el('nav-cart').addEventListener('click', ()=> showSection('cart'));
  if(el('nav-history')) el('nav-history').addEventListener('click', ()=> showSection('history'));
  if(el('btn-clear-cart')) el('btn-clear-cart').addEventListener('click', ()=> { if(confirm('Kosongkan keranjang?')) { clearCart(); renderCart(); refreshCartCount(); } });
  if(el('btn-checkout')) el('btn-checkout').addEventListener('click', ()=> {
    const cart = getCart();
    if(cart.length === 0){ alert('Keranjang kosong.'); return; }
    openModal({ type: 'checkout' });
  });
  if(el('modal')) makeModal();
  refreshCartCount();
  if(document.body.classList.contains('admin')) return; // skip user init on admin page
  // try initial load
  loadProductsToGrid();
  renderCart();
});

/* -------------------- ADMIN: products CRUD + orders management -------------------- */
async function adminLoadProductsList(){
  const list = el('admin-products-list');
  if(!list) return;
  list.innerHTML = '<div class="empty">Memuat produk...</div>';
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if(error){ list.innerHTML = '<div class="empty">Gagal memuat produk.</div>'; console.error(error); return; }
  if(!data || data.length === 0){ list.innerHTML = '<div class="empty">Belum ada produk.</div>'; return; }
  list.innerHTML = '';
  data.forEach(p=>{
    const node = document.createElement('div'); node.className = 'admin-product';
    node.innerHTML = `
      <img src="${p.image || '/img/placeholder.png'}" alt="${p.name}" />
      <div style="flex:1">
        <strong>${p.name}</strong><div class="muted">Rp ${numberWithCommas(p.price)}</div>
      </div>
      <div class="admin-product-actions">
        <button class="btn" data-edit="${p.id}">Edit</button>
        <button class="btn danger" data-delete="${p.id}">Hapus</button>
      </div>
    `;
    list.appendChild(node);
  });
  // attach event
  list.querySelectorAll('[data-edit]').forEach(b=>{
    b.addEventListener('click', async e=>{
      const id = e.currentTarget.dataset.edit;
      const { data } = await supabase.from('products').select('*').eq('id', id).single();
      if(data){
        el('p-id').value = data.id;
        el('p-name').value = data.name;
        el('p-price').value = data.price;
        el('p-image').value = data.image;
        el('p-desc').value = data.description;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
  list.querySelectorAll('[data-delete]').forEach(b=>{
    b.addEventListener('click', async e=>{
      const id = e.currentTarget.dataset.delete;
      if(!confirm('Hapus produk ini?')) return;
      const { error } = await supabase.from('products').delete().eq('id', id);
      if(error) alert('Gagal hapus produk');
      else adminLoadProductsList();
    });
  });
}

/* product form handling (admin) */
if (document.getElementById('product-form')){
  document.getElementById('product-form').addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const id = el('p-id').value || null;
    const payload = {
      name: el('p-name').value.trim(),
      price: parseFloat(el('p-price').value) || 0,
      image: el('p-image').value.trim(),
      description: el('p-desc').value.trim()
    };
    if(!payload.name){ alert('Nama wajib diisi'); return; }
    if(id){
      const { error } = await supabase.from('products').update(payload).eq('id', id);
      if(error) alert('Gagal update produk'); else { alert('Produk diupdate'); el('product-form').reset(); adminLoadProductsList(); }
    } else {
      const { error } = await supabase.from('products').insert([payload]);
      if(error) alert('Gagal tambah produk'); else { alert('Produk ditambahkan'); el('product-form').reset(); adminLoadProductsList(); }
    }
  });
  document.getElementById('reset-product').addEventListener('click', ()=> el('product-form').reset());
  // logout
  const logoutBtn = document.getElementById('admin-logout');
  if(logoutBtn) logoutBtn.addEventListener('click', ()=> { localStorage.removeItem('store_is_admin'); location.href = 'login-admin.html'; });
  // initial admin load
  adminLoadProductsList();
}

/* Admin orders list & actions */
async function adminLoadOrders(){
  const list = el('admin-orders-list');
  if(!list) return;
  list.innerHTML = '<div class="empty">Memuat pesanan...</div>';
  // fetch orders
  const { data: orders, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if(error){ list.innerHTML = '<div class="empty">Gagal memuat pesanan.</div>'; console.error(error); return; }
  if(!orders || orders.length === 0){ list.innerHTML = '<div class="empty">Belum ada pesanan.</div>'; return; }
  const prodIds = Array.from(new Set(orders.map(o=>o.product)));
  const { data: products } = await supabase.from('products').select('*').in('id', prodIds);
  const map = {}; (products||[]).forEach(p=>map[p.id]=p);
  list.innerHTML = '';
  orders.forEach(o=>{
    const p = map[o.product] || { name: '(produk dihapus)' };
    const node = document.createElement('div'); node.className = 'order-item';
    node.innerHTML = `
      <div style="flex:1">
        <div><strong>${p.name}</strong> <span class="muted">(${o.username})</span></div>
        <div class="muted">WA: ${o.phone} — Tanggal: ${new Date(o.created_at || Date.now()).toLocaleString()}</div>
        <div>Status: <strong>${o.status}</strong></div>
      </div>
      <div class="order-actions">
        <button class="btn success" data-done="${o.id}">Done</button>
        <button class="btn warning" data-cancel="${o.id}">Batal</button>
      </div>
    `;
    list.appendChild(node);
  });
  // attach actions
  list.querySelectorAll('[data-done]').forEach(b=>{
    b.addEventListener('click', async e=>{
      const id = e.currentTarget.dataset.done;
      if(!confirm('Tandai Done?')) return;
      const { error } = await supabase.from('orders').update({ status: 'done' }).eq('id', id);
      if(error) alert('Gagal update status'); else adminLoadOrders();
    });
  });
  list.querySelectorAll('[data-cancel]').forEach(b=>{
    b.addEventListener('click', async e=>{
      const id = e.currentTarget.dataset.cancel;
      if(!confirm('Tandai Batal?')) return;
      const { error } = await supabase.from('orders').update({ status: 'canceled' }).eq('id', id);
      if(error) alert('Gagal update status'); else adminLoadOrders();
    });
  });
}
if (el('admin-orders-list')) adminLoadOrders();

/* -------------------- Realtime subscriptions -------------------- */
/* products */
supabase.channel('realtime-products')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
    // update user & admin lists
    if (el('products')) loadProductsToGrid();
    if (el('admin-products-list')) adminLoadProductsList();
  }).subscribe().catch(err=>console.warn('subscribe products', err));

/* orders */
supabase.channel('realtime-orders')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
    // update admin orders & user history
    if (el('admin-orders-list')) adminLoadOrders();
    if (el('history-list')) renderHistory();
  }).subscribe().catch(err=>console.warn('subscribe orders', err));

/* -------------------- Listen cart-change event for multiple tabs */
window.addEventListener('storage', (e)=>{
  if(e.key === CART_KEY) {
    refreshCartCount();
    if(el('page-cart') && el('page-cart').style.display === 'block') renderCart();
  }
});
window.addEventListener('cart-changed', ()=>{ refreshCartCount(); });

/* -------------------- Expose small functions to global for inline onclick usage */
window.addToCart = function(id){ addToCart(id); refreshCartCount(); };
window.openBuyModal = function(id){ openModal({type:'buy', productId:id}); };

/* -------------------- Try to init UI if necessary -------------------- */
(function tryInit(){
  // if index page present, initialize UI values
  if(el('products')){ refreshCartCount(); loadProductsToGrid(); renderCart(); }
  // if admin page present
  if(el('admin-products-list')){ adminLoadProductsList(); adminLoadOrders(); }
})();
