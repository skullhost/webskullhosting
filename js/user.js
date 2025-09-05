const SUPABASE_URL = "https://zvqlsgwccrdqjgcxgmzq.supabase.co";
const SUPABASE_KEY = "YOUR_ANON_KEY";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Tampilkan produk
async function loadUserProducts() {
  const box = document.getElementById("user-products");
  if (!box) return;
  const { data, error } = await supabase.from("products").select("*").order("name");
  if (error) {
    console.error(error);
    box.innerHTML = "<p>Gagal memuat produk.</p>";
    return;
  }
  if (!data || data.length === 0) {
    box.innerHTML = "<p>Belum ada produk.</p>";
    return;
  }
  box.innerHTML = data.map(p => `
    <div class="product-card">
      <img src="${p.image}" alt="${p.name}">
      <div class="product-info">
        <h4>${p.name}</h4>
        <p>Rp${p.price}</p>
        <button onclick="addToCart('${p.id}')">Keranjang</button>
        <button onclick="buyNow('${p.id}')">Beli</button>
      </div>
    </div>`).join("");
}

function addToCart(id) {
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  if (!cart.includes(id)) cart.push(id);
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Produk ditambahkan ke keranjang!");
}

function buyNow(id) {
  const username = prompt("Masukkan username:");
  const phone = prompt("Masukkan nomor WhatsApp:");
  if (!username || !phone) return;
  supabase.from("orders").insert([{ username, phone, product: id, status: "pending" }])
    .then(({ error }) => {
      if (error) {
        console.error(error);
        alert("Gagal membuat pesanan.");
      } else {
        alert("Pesanan terkirim!");
      }
    });
}

document.addEventListener("DOMContentLoaded", loadUserProducts);
