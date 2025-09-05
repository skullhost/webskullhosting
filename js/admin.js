import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ganti URL dan KEY sesuai project kamu
const SUPABASE_URL = "https://zvqlsgwccrdqjgcxgmzq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2cWxzZ3djY3JkcWpnY3hnbXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNTc0MDUsImV4cCI6MjA3MjYzMzQwNX0.6Ge1ON_x9Ce-l4tFRtH_Ks9o3v1RouLIDejtbohjo4Y";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM element
const productList = document.getElementById("product-list");
const orderList   = document.getElementById("order-list");
const addForm     = document.getElementById("add-product-form");

// debug
console.log("productList element:", productList);
console.log("orderList element:", orderList);

async function loadProducts() {
  const { data, error } = await supabase.from("products").select("*");
  console.log("Products:", data, error);
  if (error) return;

  productList.innerHTML = "";
  data.forEach(prod => {
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

async function loadOrders() {
  const { data, error } = await supabase.from("orders").select("*");
  console.log("Orders:", data, error);
  if (error) return;

  orderList.innerHTML = "";
  data.forEach(ord => {
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

addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("product-name").value;
  const price = document.getElementById("product-price").value;
  const image = document.getElementById("product-image").value;
  const description = document.getElementById("product-description").value;

  const { error } = await supabase.from("products").insert([{ name, price, image, description }]);
  if (error) {
    console.error("Tambah produk gagal:", error);
  } else {
    addForm.reset();
    loadProducts();
  }
});

window.deleteProduct = async (id) => {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) console.error("Gagal hapus:", error);
  else loadProducts();
};

window.updateStatus = async (id, status) => {
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) console.error("Gagal update:", error);
  else loadOrders();
};

window.showSection = (section) => {
  document.getElementById("products-section").style.display = section === "products" ? "block" : "none";
  document.getElementById("orders-section").style.display = section === "orders" ? "block" : "none";
};

loadProducts();
loadOrders();
