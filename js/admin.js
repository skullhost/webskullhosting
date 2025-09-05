const SUPABASE_URL = "https://zvqlsgwccrdqjgcxgmzq.supabase.co";
const SUPABASE_KEY = "YOUR_SERVICE_ROLE_OR_ANON_KEY";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadAdminProducts() {
  const { data, error } = await supabase.from("products").select("*").order("name");
  const tbody = document.getElementById("admin-products");
  if (error) { console.error(error); return; }
  tbody.innerHTML = data.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>Rp${p.price}</td>
      <td><img src="${p.image}" alt="" style="width:60px;height:60px;"></td>
      <td>${p.description || ""}</td>
      <td class="admin-actions">
        <button class="edit" onclick="editProduct('${p.id}','${p.name}',${p.price},'${p.image}','${p.description||""}')">Edit</button>
        <button class="delete" onclick="deleteProduct('${p.id}')">Hapus</button>
      </td>
    </tr>`).join("");
}

function editProduct(id, name, price, image, description) {
  document.getElementById("product-id").value = id;
  document.getElementById("product-name").value = name;
  document.getElementById("product-price").value = price;
  document.getElementById("product-image").value = image;
  document.getElementById("product-description").value = description;
}

async function saveProduct() {
  const id = document.getElementById("product-id").value;
  const name = document.getElementById("product-name").value;
  const price = parseFloat(document.getElementById("product-price").value);
  const image = document.getElementById("product-image").value;
  const description = document.getElementById("product-description").value;
  if (!name || !price || !image) { alert("Lengkapi form"); return; }

  if (id) {
    const { error } = await supabase.from("products").update({ name, price, image, description }).eq("id", id);
    if (error) console.error(error);
  } else {
    const { error } = await supabase.from("products").insert([{ name, price, image, description }]);
    if (error) console.error(error);
  }
  clearForm(); loadAdminProducts();
}

function clearForm() {
  document.getElementById("product-id").value = "";
  document.getElementById("product-name").value = "";
  document.getElementById("product-price").value = "";
  document.getElementById("product-image").value = "";
  document.getElementById("product-description").value = "";
}

async function deleteProduct(id) {
  if (!confirm("Hapus produk?")) return;
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) console.error(error);
  loadAdminProducts();
}

async function loadOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*, products(name)")
    .order("created_at", { ascending: false });
  if (error) { console.error(error); return; }
  document.getElementById("admin-orders").innerHTML = data.map(o => `
    <tr>
      <td>${o.username}</td>
      <td>${o.phone}</td>
      <td>${o.products?.name || o.product}</td>
      <td>${o.status}</td>
      <td class="admin-actions">
        <button class="done" onclick="updateOrder('${o.id}','done')">Done</button>
        <button class="cancel" onclick="updateOrder('${o.id}','canceled')">Batal</button>
      </td>
    </tr>`).join("");
}

async function updateOrder(id, status) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) console.error(error);
  loadOrders();
}

document.addEventListener("DOMContentLoaded", () => {
  loadAdminProducts();
  loadOrders();
});
