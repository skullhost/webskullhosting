// ----- KONFIGURASI SUPABASE -----
const SUPABASE_URL = "https://PROJECT_ID.supabase.co";
const SUPABASE_KEY = "ANON_PUBLIC_KEY";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ----- LOAD PRODUK UNTUK USER -----
async function loadProducts() {
  const { data, error } = await supabase.from("products").select("*");
  if (error) return console.error("Load products error:", error);

  const container = document.getElementById("product-list");
  if (container) {
    container.innerHTML = "";
    data.forEach(p => {
      container.innerHTML += `
        <div>
          <img src="${p.image}" alt="${p.name}" width="100%">
          <h3>${p.name}</h3>
          <p>Rp${p.price}</p>
          <button onclick="addToCart('${p.id}')">Keranjang</button>
        </div>`;
    });
  }
}
loadProducts();

// ----- CART (localStorage) -----
function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}
function addToCart(id) {
  const cart = getCart();
  cart.push(id);
  saveCart(cart);
  alert("Ditambahkan ke keranjang!");
}

// ----- TAMPILKAN CART -----
function renderCart() {
  const cart = getCart();
  const box = document.getElementById("cart-items");
  if (!box) return;
  box.innerHTML = "";

  cart.forEach(async (id) => {
    const { data } = await supabase.from("products").select("*").eq("id", id).single();
    box.innerHTML += `<div>${data.name} - Rp${data.price}</div>`;
  });
}
renderCart();

// ----- CHECKOUT -----
async function checkout() {
  const username = document.getElementById("username").value;
  const phone = document.getElementById("phone").value;
  const cart = getCart();
  for (let pid of cart) {
    const { error } = await supabase.from("orders").insert([{ username, phone, product: pid }]);
    if (error) console.error("Insert order error:", error);
  }
  saveCart([]);
  alert("Pesanan berhasil, admin akan menghubungi Anda.");
}

// ----- ORDER HISTORY -----
async function loadHistory() {
  const box = document.getElementById("order-history");
  if (!box) return;
  const { data, error } = await supabase.from("orders").select("*, products(name, price)").order("created_at", { ascending: false });
  if (error) return console.error(error);
  box.innerHTML = data.map(o => `<div>${o.products.name} - ${o.status}</div>`).join("");
}
loadHistory();

// ----- ADMIN: ADD PRODUCT -----
async function addProduct() {
  const name = document.getElementById("p-name").value;
  const price = document.getElementById("p-price").value;
  const image = document.getElementById("p-img").value;
  const description = document.getElementById("p-desc").value;

  const { error } = await supabase.from("products").insert([{ name, price, image, description }]);
  if (error) return console.error("Add product error:", error);
  alert("Produk ditambahkan!");
  adminLoadProducts();
}

// ----- ADMIN: LIST PRODUCTS -----
async function adminLoadProducts() {
  const box = document.getElementById("admin-products");
  if (!box) return;
  const { data, error } = await supabase.from("products").select("*");
  if (error) return console.error(error);
  box.innerHTML = data.map(p => `<div>${p.name} - Rp${p.price}</div>`).join("");
}
adminLoadProducts();

// ----- ADMIN: LIST ORDERS -----
async function adminLoadOrders() {
  const box = document.getElementById("admin-orders");
  if (!box) return;
  const { data, error } = await supabase.from("orders").select("*, products(name)").order("created_at", { ascending: false });
  if (error) return console.error(error);

  box.innerHTML = data.map(o => `
    <div>
      ${o.username} - ${o.products.name} - ${o.status}
      <button onclick="updateOrder('${o.id}','done')">Done</button>
      <button onclick="updateOrder('${o.id}','canceled')">Batal</button>
    </div>`).join("");
}
adminLoadOrders();

async function updateOrder(id, status) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) console.error(error);
  adminLoadOrders();
}
