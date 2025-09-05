/* store.js
   Shared storage helpers for both user and admin.
   Keys:
     - store_products : array of product {id,title,price,image,description}
     - store_cart : array of {productId,qty}
     - store_orders : array of {id,productId,username,phone,qty,status,createdAt}
*/
const Store = (function(){
  const K_PROD = 'store_products';
  const K_CART = 'store_cart';
  const K_ORD = 'store_orders';

  function uid(prefix='id'){
    return prefix + '_' + Math.random().toString(36).slice(2,9);
  }

  // Products
  function getProducts(){
    try{ return JSON.parse(localStorage.getItem(K_PROD) || '[]'); } catch(e){ return [];}
  }
  function saveProducts(arr){ localStorage.setItem(K_PROD, JSON.stringify(arr)); }
  function addProduct({title,price,image,description}){
    const arr = getProducts();
    arr.push({id: uid('p'), title, price, image, description});
    saveProducts(arr);
    // notify
    localStorage.setItem('last_updated_products', Date.now());
  }
  function updateProduct(id, data){
    const arr = getProducts();
    const i = arr.findIndex(x=>x.id===id);
    if(i!==-1){
      arr[i] = {...arr[i], ...data};
      saveProducts(arr);
      localStorage.setItem('last_updated_products', Date.now());
    }
  }
  function deleteProduct(id){
    let arr = getProducts();
    arr = arr.filter(x=>x.id!==id);
    saveProducts(arr);
    localStorage.setItem('last_updated_products', Date.now());
  }
  function getProduct(id){
    return getProducts().find(p=>p.id===id);
  }

  // Cart (per-browser)
  function getCart(){
    try{ return JSON.parse(localStorage.getItem(K_CART) || '[]'); } catch(e){ return [];}
  }
  function saveCart(c){ localStorage.setItem(K_CART, JSON.stringify(c)); }
  function addToCart(productId){
    const c = getCart();
    const found = c.find(i=>i.productId===productId);
    if(found) found.qty++;
    else c.push({productId, qty:1});
    saveCart(c);
    localStorage.setItem('last_updated_cart', Date.now());
  }
  function removeFromCart(productId){
    let c = getCart();
    c = c.filter(i=>i.productId !== productId);
    saveCart(c);
    localStorage.setItem('last_updated_cart', Date.now());
  }
  function clearCart(){
    saveCart([]);
    localStorage.setItem('last_updated_cart', Date.now());
  }
  function getCartQty(){
    const c = getCart();
    return c.reduce((s,i)=>s + (i.qty||0), 0);
  }

  // Orders
  function getOrders(){
    try{ return JSON.parse(localStorage.getItem(K_ORD) || '[]'); } catch(e){ return [];}
  }
  function saveOrders(arr){ localStorage.setItem(K_ORD, JSON.stringify(arr)); localStorage.setItem('last_updated_orders', Date.now()); }
  function createOrder({productId, username, phone, qty=1}){
    const arr = getOrders();
    arr.push({ id: uid('o'), productId, username, phone, qty, status: 'pending', createdAt: Date.now() });
    saveOrders(arr);
  }
  function updateOrderStatus(id, status){
    const arr = getOrders();
    const i = arr.findIndex(o=>o.id===id);
    if(i!==-1){
      arr[i].status = status;
      saveOrders(arr);
    }
  }

  return {
    // product API
    getProducts, addProduct, updateProduct, deleteProduct, getProduct,
    // cart API
    getCart, addToCart, removeFromCart, clearCart, getCartQty,
    // orders
    getOrders, createOrder, updateOrderStatus
  };
})();
