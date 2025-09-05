import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// === KONFIGURASI SUPABASE ===
const SUPABASE_URL = "https://zvqlsgwccrdqjgcxgmzq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2cWxzZ3djY3JkcWpnY3hnbXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNTc0MDUsImV4cCI6MjA3MjYzMzQwNX0.6Ge1ON_x9Ce-l4tFRtH_Ks9o3v1RouLIDejtbohjo4Y"; // gunakan service key kalau mau bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// === ELEMENT DOM ===
const productList = document.getElementById("product-list");
const orderList = document.getElementById("order-list");
const addProductForm = document.getElementById("add-product-form");

// ========== PRODUK ==========
async function loadProducts() {
  productList.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";

  const { data, error } = await supabase.from("products").select("*");
  console.log("Products:", data, error);

  if (error) {
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

addProductForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = e.target.name.value.trim();
  const price = parseFloat(e.target.price.value);
  const image = e.target.image.value.trim();
  const description = e.target.description.value.trim();

  const { error } = await supabase.from("products").insert([{ name, price, image, description }]);
  if (error) {
    alert("Gagal tambah produk");
    console.error(error);
  } else {
    alert("Produk berhasil ditambahkan");
    addProductForm.reset();
    loadProducts();
  }
});

async function deleteProduct(id) {
  if (!confirm("Hapus produk ini?")) return;
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    alert("Gagal hapus produk");
    console.error(error);
  } else {
    loadProducts();
  }
}

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

// ========== PESANAN ==========
async function loadOrders() {
  orderList.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";

  const { data, error } = await supabase.from("orders").select("*");
  console.log("Orders:", data, error);

  if (error) {
    orderList.innerHTML = "<tr><td colspan='5'>Gagal memuat pesanan</td></tr>";
    return;
  }
  if (!data || data.length === 0) {
    orderList.innerHTML = "<tr><td colspan='5'>Belum ada pesanan</td></tr>";
    return;
  }

  orderList.innerHTML = "";
  data.forEach((order) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${order.username}</td>
      <td>${order.phone}</td>
      <td>${order.product}</td>
      <td>${order.status}</td>
      <td>
        <button onclick="updateStatus('${order.id}', 'done')">Done</button>
        <button onclick="updateStatus('${order.id}', 'canceled')">Batal</button>
      </td>
    `;
    orderList.appendChild(tr);
  });
}

async function updateStatus(orderId, newStatus) {
  const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
  if (error) {
    alert("Gagal update status");
    console.error(error);
  } else {
    loadOrders();
  }
}

// ========== INIT ==========
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.updateStatus = updateStatus;

loadProducts();
loadOrders();
