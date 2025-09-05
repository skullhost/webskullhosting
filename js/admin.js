// admin.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// === GANTI DENGAN PUNYA KAMU SENDIRI ===
const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_KEY = "YOUR-ANON-KEY";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM element
const productList = document.getElementById("product-list");
const orderList   = document.getElementById("order-list");
const addForm     = document.getElementById("add-product-form");

// Debug supaya tahu elemen ketemu
console.log("productList element:", productList);
console.log("orderList element:", orderList);

// === PRODUK ===
async function loadProducts() {
  const { data, error } = await supabase.from("products").select("*");
  console.log("Products:", data, error);

  if (error) {
    alert("Gagal memuat produk: " + error.message);
    return;
  }

  productList.innerHTML = "";
  data.forEach((prod) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img src="${prod.image}" alt="${prod.name}" style="width:60px"></td>
      <td>${prod.name}</td>
      <td>${prod.price}</td>
      <td>${prod.description || ""}</td>
      <td>
        <button onclick="deleteProduct('${prod.id}')">Hapus</button>
      </td>
    `;
    productList.appendChild(tr);
  });
}

// === PESANAN ===
async function loadOrders() {
  const { data, error } = await supabase.from("orders").select("*");
  console.log("Orders:", data, error);

  if (error) {
    alert("Gagal memuat pesanan: " + error.message);
    return;
  }

  orderList.innerHTML = "";
  data.forEach((ord) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ord.username}</td>
      <td>${ord.phone}</td>
      <td>${ord.product}</td>
      <td>${ord.status}</td>
      <td>
        <button onclick="updateStatus('${ord.id}', 'done')">Done</button>
        <button onclick="updateStatus('${ord.id}', 'canceled')">Batal</button>
      </td>
    `;
    orderList.appendChild(tr);
  });
}

// === FORM TAMBAH PRODUK ===
addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("product-name").value;
  const price = document.getElementById("product-price").value;
  const image = document.getElementById("product-image").value;
  const description = document.getElementById("product-description").value;

  const { error } = await supabase.from("products").insert([{ name, price, image, description }]);
  if (error) {
    console.error("Tambah produk gagal:", error);
    alert("Gagal tambah produk: " + error.message);
  } else {
    addForm.reset();
    loadProducts();
  }
});

// === AKSI PRODUK ===
window.deleteProduct = async (id) => {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("Gagal hapus:", error);
    alert("Gagal hapus produk: " + error.message);
  } else {
    loadProducts();
  }
};

// === UPDATE STATUS PESANAN ===
window.updateStatus = async (id, newStatus) => {
  const { data, error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Gagal update status:", error);
    alert("Gagal update status: " + error.message);
  } else {
    console.log("Update sukses:", data);
    loadOrders();
  }
};

// === SWITCH HALAMAN (Produk / Pesanan) ===
window.showSection = (section) => {
  document.getElementById("products-section").style.display = section === "products" ? "block" : "none";
  document.getElementById("orders-section").style.display = section === "orders" ? "block" : "none";
};

// === INISIALISASI ===
loadProducts();
loadOrders();
