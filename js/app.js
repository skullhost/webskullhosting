// === KONFIG SUPABASE ===
const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co"; // ganti
const SUPABASE_KEY = "YOUR_ANON_KEY"; // ganti
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// === TAMBAH PRODUK ===
const formAdd = document.getElementById("add-product-form");
if (formAdd) {
  formAdd.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("product-name").value.trim();
    const price = parseFloat(document.getElementById("product-price").value);
    const image = document.getElementById("product-image").value.trim();
    const description = document.getElementById("product-desc").value.trim();

    const { error } = await supabase
      .from("products")
      .insert([{ name, price, image, description }]);
    if (error) {
      console.error("Tambah produk error:", error);
      alert("Gagal menambah produk");
    } else {
      formAdd.reset();
      adminLoadProducts();
      alert("Produk berhasil ditambah");
    }
  });
}

// === MUAT PRODUK ADMIN ===
async function adminLoadProducts() {
  const box = document.getElementById("admin-products");
  if (!box) return;

  const { data, error } = await supabase.from("products").select("*").order("name");
  if (error) return console.error("Load products error:", error);

  box.innerHTML = data
    .map(
      (p) => `
    <div class="product-card">
      <img src="${p.image}" alt="${p.name}" />
      <div class="product-info">
        <h4>${p.name}</h4>
        <p>Rp${p.price}</p>
        <button onclick="editProduct('${p.id}', '${p.name}', '${p.price}')">Edit</button>
        <button onclick="deleteProduct('${p.id}')">Hapus</button>
      </div>
    </div>`
    )
    .join("");
}

async function deleteProduct(id) {
  if (!confirm("Hapus produk ini?")) return;
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return console.error("Delete error:", error);
  adminLoadProducts();
}

async function editProduct(id, currentName, currentPrice) {
  const newName = prompt("Nama baru:", currentName);
  const newPrice = prompt("Harga baru:", currentPrice);
  if (!newName || !newPrice) return;
  const { error } = await supabase
    .from("products")
    .update({ name: newName, price: parseFloat(newPrice) })
    .eq("id", id);
  if (error) return console.error("Edit error:", error);
  adminLoadProducts();
}

// === MUAT PESANAN ===
async function adminLoadOrders() {
  const box = document.getElementById("admin-orders");
  if (!box) return;

  const { data, error } = await supabase
    .from("orders")
    .select("id, username, phone, status, products(name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load orders error:", error);
    return;
  }

  box.innerHTML = data
    .map(
      (o) => `
    <div class="order-card">
      <h4>${o.username} (${o.phone})</h4>
      <p>Produk: ${o.products?.name || "-"}</p>
      <p>Status: <strong>${o.status}</strong></p>
      <button onclick="updateOrder('${o.id}', 'done')">Done</button>
      <button onclick="updateOrder('${o.id}', 'canceled')">Batal</button>
    </div>`
    )
    .join("");
}

async function updateOrder(id, status) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) return console.error("Update order error:", error);
  adminLoadOrders();
}

// === INIT ===
document.addEventListener("DOMContentLoaded", () => {
  adminLoadProducts();
  adminLoadOrders();
});
