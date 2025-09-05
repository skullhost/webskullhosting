// admin.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// === Konfigurasi Supabase ===
const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_KEY = "YOUR-ANON-KEY"; // atau service key (jangan commit kalau public!)
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// === ELEMENT ===
const productList = document.getElementById("product-list");
const orderList = document.getElementById("order-list");
const addProductForm = document.getElementById("add-product-form");

// ============ PRODUK ==============

// Muat semua produk
async function loadProducts() {
  productList.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: true });

  if (error) {
    console.error("Gagal muat produk:", error);
    productList.innerHTML = "<tr><td colspan='5'>Gagal memuat produk</td></tr>";
    return;
  }

  if (!data || data.length === 0) {
    productList.innerHTML = "<tr><td colspan='5'>Belum ada produk</td></tr>";
    return;
  }

  productList.innerHTML = "";
  data.forEach((prod) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img src="${prod.image}" alt="${prod.name}" width="50"></td>
      <td>${prod.name}</td>
      <td>Rp ${prod.price}</td>
      <td>${prod.description || "-"}</td>
      <td>
        <button onclick="editProduct('${prod.id}')">Edit</button>
        <button onclick="deleteProduct('${prod.id}')">Hapus</button>
      </td>
    `;
    productList.appendChild(tr);
  });
}

// Tambah produk
addProductForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = e.target.name.value.trim();
  const price = parseFloat(e.target.price.value);
  const image = e.target.image.value.trim();
  const description = e.target.description.value.trim();

  const { data, error } = await supabase
    .from("products")
    .insert([{ name, price, image, description }])
    .select();

  if (error) {
    alert("Gagal tambah produk!");
    console.error(error);
  } else {
    alert("Produk berhasil ditambahkan");
    addProductForm.reset();
    loadProducts();
  }
});

// Hapus produk
async function deleteProduct(id) {
  if (!confirm("Yakin hapus produk?")) return;
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    alert("Gagal hapus produk");
    console.error(error);
  } else {
    loadProducts();
  }
}

// Edit produk (contoh sederhana prompt)
async function editProduct(id) {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
  if (error || !data) {
    alert("Produk tidak ditemukan");
    return;
  }
  const newName = prompt("Nama produk:", data.name);
  const newPrice = parseFloat(prompt("Harga:", data.price));
  const newImage = prompt("URL gambar:", data.image);
  const newDesc = prompt("Deskripsi:", data.description);

  const { error: updateError } = await supabase
    .from("products")
    .update({ name: newName, price: newPrice, image: newImage, description: newDesc })
    .eq("id", id);

  if (updateError) {
    alert("Gagal update produk");
    console.error(updateError);
  } else {
    loadProducts();
  }
}

// ============ PESANAN ==============

// Muat semua pesanan
async function loadOrders() {
  orderList.innerHTML = "<tr><td colspan='6'>Loading...</td></tr>";
  const { data, error } = await supabase
    .from("orders")
    .select("*, products(name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal muat pesanan:", error);
    orderList.innerHTML = "<tr><td colspan='6'>Gagal memuat pesanan</td></tr>";
    return;
  }

  if (!data || data.length === 0) {
    orderList.innerHTML = "<tr><td colspan='6'>Belum ada pesanan</td></tr>";
    return;
  }

  orderList.innerHTML = "";
  data.forEach((order) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${order.username}</td>
      <td>${order.phone}</td>
      <td>${order.products?.name || "-"}</td>
      <td>${order.status}</td>
      <td>${new Date(order.created_at).toLocaleString()}</td>
      <td>
        <button onclick="updateStatus('${order.id}', 'done')">Done</button>
        <button onclick="updateStatus('${order.id}', 'canceled')">Batal</button>
      </td>
    `;
    orderList.appendChild(tr);
  });
}

// Update status pesanan
async function updateStatus(orderId, newStatus) {
  const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
  if (error) {
    alert("Gagal update status");
    console.error(error);
  } else {
    loadOrders();
  }
}

// ============ INIT ==============
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.updateStatus = updateStatus;

loadProducts();
loadOrders();
