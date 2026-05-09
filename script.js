let menuData = [];
let cart = [];
let activeCategory = "Все";
let toastTimer = null;
let promo = { code: "", discount: 0 };

const CART_KEY = "pervoe-vtoroe-cart";
const PROMO_KEY = "pervoe-vtoroe-promo";
const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500'%3E%3Crect width='100%25' height='100%25' fill='%23f2f2f2'/%3E%3Ctext x='50%25' y='50%25' fill='%23888888' font-size='30' text-anchor='middle' dominant-baseline='middle'%3EНет фото%3C/text%3E%3C/svg%3E";

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map((item) => item.replace(/^"|"$/g, ""));
}

function money(value) {
  return `${Number(value || 0).toLocaleString("ru-RU")}₸`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizePhotoUrl(rawUrl) {
  const url = String(rawUrl || "").trim();
  if (!url) return "";
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${driveFileMatch[1]}&sz=w1200`;
  }
  const driveIdMatch = url.match(/[?&]id=([^&]+)/i);
  if (driveIdMatch && /drive\.google\.com/i.test(url)) {
    return `https://drive.google.com/thumbnail?id=${driveIdMatch[1]}&sz=w1200`;
  }
  return url;
}

function showToast(text) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1400);
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      cart = parsed.filter((item) => item && item.name && Number(item.qty) > 0);
    }
  } catch {
    cart = [];
  }
}

function savePromo() {
  localStorage.setItem(PROMO_KEY, JSON.stringify(promo));
}

function loadPromo() {
  try {
    const raw = localStorage.getItem(PROMO_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.discount === "number") {
      promo = parsed;
    }
  } catch {
    promo = { code: "", discount: 0 };
  }
}

function applyPromoCode() {
  const input = document.getElementById("promo-code");
  const hint = document.getElementById("promo-hint");
  const code = String(input.value || "").trim().toUpperCase();

  if (!code) {
    promo = { code: "", discount: 0 };
    hint.textContent = "Промокод не указан";
    savePromo();
    updateTotals();
    return;
  }

  if (code === "SKIDKA10") {
    promo = { code, discount: 10 };
    hint.textContent = "Промокод применен: скидка 10%";
  } else if (code === "FIRST200") {
    promo = { code, discount: 200 };
    hint.textContent = "Промокод применен: скидка 200₸";
  } else {
    promo = { code: "", discount: 0 };
    hint.textContent = "Промокод не найден";
  }

  savePromo();
  updateTotals();
}

function getCartQty(name) {
  const found = cart.find((x) => x.name === name);
  return found ? found.qty : 0;
}

function openCart() {
  document.getElementById("cart-modal").classList.add("show");
  document.body.classList.add("no-scroll");
}

function closeCart() {
  document.getElementById("cart-modal").classList.remove("show");
  document.body.classList.remove("no-scroll");
}

function showThanksModal() {
  const el = document.getElementById("thanks-modal");
  if (el) el.classList.add("show");
}

function hideThanksModal() {
  const el = document.getElementById("thanks-modal");
  if (el) el.classList.remove("show");
}

function updateCartButton() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const btn = document.getElementById("cart-button");
  const countEl = document.getElementById("cart-count");
  countEl.textContent = count;
  btn.style.display = count > 0 ? "inline-flex" : "none";
}

function updateTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  let discountAmount = 0;
  if (promo.discount > 0 && promo.discount < 100) {
    discountAmount = Math.round(subtotal * promo.discount / 100);
  } else {
    discountAmount = promo.discount;
  }
  discountAmount = Math.min(discountAmount, subtotal);
  const finalTotal = subtotal - discountAmount;

  document.getElementById("subtotal-amount").textContent = money(subtotal);
  document.getElementById("discount-amount").textContent = money(discountAmount);
  document.getElementById("total-amount").textContent = Number(finalTotal).toLocaleString("ru-RU");

  return { finalTotal };
}

function updateMenuControls() {
  document.querySelectorAll("[data-item-name]").forEach((card) => {
    const name = card.dataset.itemName;
    const controls = card.querySelector(".item-controls");
    if (!controls) return;
    const qty = getCartQty(name);

    controls.innerHTML = qty > 0
      ? `<div class="qty-inline"><button class="card-minus" data-name="${escapeHtml(name)}">-</button><span>${qty}</span><button class="card-plus" data-name="${escapeHtml(name)}">+</button></div>`
      : `<button class="btn-add" data-name="${escapeHtml(name)}">Добавить</button>`;
  });

  bindMenuControlEvents();
}

function addToCart(item) {
  const found = cart.find((x) => x.name === item.name);
  if (found) found.qty += 1;
  else cart.push({ name: item.name, price: item.price, qty: 1, weight: item.weight, calories: item.calories });

  renderCart();
  updateMenuControls();
  saveCart();
  showToast(`${item.name} добавлено в корзину`);
}

function changeQty(name, delta) {
  const found = cart.find((x) => x.name === name);
  if (!found) return;
  found.qty += delta;
  if (found.qty <= 0) cart = cart.filter((x) => x.name !== name);

  renderCart();
  updateMenuControls();
  saveCart();
}

function removeFromCart(name) {
  cart = cart.filter((x) => x.name !== name);
  renderCart();
  updateMenuControls();
  saveCart();
}

function renderCategories() {
  const categoriesEl = document.getElementById("categories");
  const categories = ["Все", ...new Set(menuData.map((item) => item.category))];

  categoriesEl.innerHTML = categories
    .map((cat) => `<button class="category-btn ${cat === activeCategory ? "active" : ""}" data-category="${cat}">${cat}</button>`)
    .join("");

  categoriesEl.querySelectorAll(".category-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.category;
      renderCategories();
      renderMenu();
    });
  });
}

function buildControlsHtml(name) {
  const qty = getCartQty(name);
  return qty > 0
    ? `<div class="qty-inline"><button class="card-minus" data-name="${escapeHtml(name)}">-</button><span>${qty}</span><button class="card-plus" data-name="${escapeHtml(name)}">+</button></div>`
    : `<button class="btn-add" data-name="${escapeHtml(name)}">Добавить</button>`;
}

function bindMenuControlEvents() {
  const grid = document.getElementById("menu-grid");

  grid.querySelectorAll(".btn-add").forEach((btn) => {
    btn.onclick = () => {
      const item = menuData.find((x) => x.name === btn.dataset.name);
      if (item) addToCart(item);
    };
  });

  grid.querySelectorAll(".card-plus").forEach((btn) => {
    btn.onclick = () => changeQty(btn.dataset.name, 1);
  });

  grid.querySelectorAll(".card-minus").forEach((btn) => {
    btn.onclick = () => changeQty(btn.dataset.name, -1);
  });
}

function renderMenu() {
  const grid = document.getElementById("menu-grid");
  const filtered = activeCategory === "Все" ? menuData : menuData.filter((item) => item.category === activeCategory);

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="status">В этой категории пока нет блюд.</p>';
    return;
  }

  grid.innerHTML = filtered
    .map((item, index) => {
      const categoryHtml = item.category ? `<p class="food-category">${item.category}</p>` : "";
      const metaParts = [];
      if (item.weight) metaParts.push(item.weight);
      if (item.calories) metaParts.push(`${item.calories} ккал`);
      const metaHtml = metaParts.length ? `<p class="food-meta">${metaParts.join(" • ")}</p>` : "";

      return `<article class="food-card" data-item-name="${escapeHtml(item.name)}" style="animation-delay:${index * 0.06}s"><img class="food-image" src="${escapeHtml(normalizePhotoUrl(item.photo) || placeholderImage)}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="this.src='${placeholderImage}'" /><div><h3 class="food-title">${item.name}</h3>${categoryHtml}${metaHtml}</div><div class="food-footer"><div class="food-price">${money(item.price)}</div><div class="item-controls">${buildControlsHtml(item.name)}</div></div></article>`;
    })
    .join("");

  bindMenuControlEvents();
}

function renderCart() {
  const cartItems = document.getElementById("cart-items");

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="status">Корзина пока пустая.</p>';
    document.getElementById("subtotal-amount").textContent = money(0);
    document.getElementById("discount-amount").textContent = money(0);
    document.getElementById("total-amount").textContent = "0";
    updateCartButton();
    return;
  }

  cartItems.innerHTML = cart
    .map((item) => {
      const sum = item.price * item.qty;
      return `<div class="cart-item"><div class="cart-item-top"><span class="cart-item-name">${item.name}</span><strong>${money(sum)}</strong></div><div class="cart-controls"><div class="qty-box"><button class="qty-btn" data-action="minus" data-name="${item.name}">-</button><span>${item.qty}</span><button class="qty-btn" data-action="plus" data-name="${item.name}">+</button></div><button class="remove-btn" data-action="remove" data-name="${item.name}">Удалить</button></div></div>`;
    })
    .join("");

  cartItems.querySelectorAll("button").forEach((btn) => {
    const { action, name } = btn.dataset;
    btn.addEventListener("click", () => {
      if (action === "plus") changeQty(name, 1);
      if (action === "minus") changeQty(name, -1);
      if (action === "remove") removeFromCart(name);
    });
  });

  updateTotals();
  updateCartButton();
}

function createWhatsAppMessage(userName, userPhone, userAddress) {
  const { finalTotal } = updateTotals();
  const orderLines = cart.map((item) => `- ${item.name} x${item.qty} \"${money(item.price * item.qty)}\"`).join("\n");
  const promoText = promo.code ? `\nПромокод: ${promo.code}` : "";
  return `Здравствуйте!\nХочу оформить заказ.\nИмя: ${userName}\nТелефон: ${userPhone}\nАдрес: ${userAddress}${promoText}\nЗаказ:\n${orderLines}\n\nИтого: ${money(finalTotal)}`;
}

function cleanPhone(phone) {
  return String(phone).replace(/\D/g, "");
}

function applyHeaderScrollState() {
  const header = document.getElementById("site-header");
  if (!header) return;
  if (window.scrollY > 120) header.classList.add("scrolled");
  else header.classList.remove("scrolled");
}

async function loadMenu() {
  const grid = document.getElementById("menu-grid");
  try {
    const response = await fetch(CONFIG.csvUrl, { redirect: "follow" });
    if (!response.ok) throw new Error(`Не удалось загрузить CSV (код ${response.status})`);

    const text = await response.text();
    const rows = text.split(/\r?\n/).filter((line) => line.trim() !== "");
    if (rows.length < 2) throw new Error("CSV пустой или нет строк с блюдами");

    const headers = parseCsvLine(rows[0]).map((h) => h.trim().toLowerCase());
    const cleanHeaders = headers.map((h) => h.replace(/\s+/g, " "));

    const aliases = {
      name: ["name", "наименование", "название"],
      price: ["price", "цена"],
      category: ["category", "категория"],
      available: ["available", "наличие (да/нет)", "наличие"],
      photo: ["photo", "фото", "image", "картинка"],
      weight: ["weight", "граммовка", "вес", "граммы"],
      calories: ["calories", "калории", "ккал"]
    };

    const findIndexByAliases = (key) => cleanHeaders.findIndex((header) => aliases[key].includes(header));

    const iName = findIndexByAliases("name");
    const iPrice = findIndexByAliases("price");
    const iCategory = findIndexByAliases("category");
    const iAvailable = findIndexByAliases("available");
    const iPhoto = findIndexByAliases("photo");
    const iWeight = findIndexByAliases("weight");
    const iCalories = findIndexByAliases("calories");

    if ([iName, iPrice, iCategory, iAvailable].some((i) => i === -1)) {
      throw new Error("В CSV нужны колонки: name/Наименование, price/Цена, category/Категория, available/Наличие (Да/Нет)");
    }

    menuData = rows
      .slice(1)
      .map((line) => parseCsvLine(line))
      .map((cols) => ({
        name: cols[iName] || "",
        price: Number(cols[iPrice]) || 0,
        category: cols[iCategory] || "",
        available: ["true", "да", "yes", "1"].includes(String(cols[iAvailable] || "").trim().toLowerCase()),
        photo: iPhoto >= 0 ? cols[iPhoto] : "",
        weight: iWeight >= 0 ? cols[iWeight] : "",
        calories: iCalories >= 0 ? cols[iCalories] : ""
      }))
      .filter((item) => item.name && item.available);

    if (!menuData.length) {
      grid.innerHTML = '<p class="status">Нет доступных блюд. Проверьте колонку Наличие (Да/Нет).</p>';
      return;
    }

    renderCategories();
    renderMenu();
  } catch (error) {
    grid.innerHTML = `<p class="status">Ошибка загрузки меню: ${error.message}</p>`;
  }
}

document.getElementById("cart-button").addEventListener("click", openCart);
document.getElementById("to-top").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
document.getElementById("thanks-close").addEventListener("click", hideThanksModal);
document.getElementById("thanks-modal").addEventListener("click", (e) => { if (e.target.id === "thanks-modal") hideThanksModal(); });
document.getElementById("close-modal").addEventListener("click", closeCart);
document.getElementById("cart-modal").addEventListener("click", (e) => { if (e.target.id === "cart-modal") closeCart(); });

document.getElementById("promo-apply").addEventListener("click", applyPromoCode);
document.getElementById("promo-code").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    applyPromoCode();
  }
});

window.addEventListener("scroll", () => {
  const topBtn = document.getElementById("to-top");
  if (window.scrollY > 380) topBtn.classList.add("show");
  else topBtn.classList.remove("show");
  applyHeaderScrollState();
});

document.getElementById("order-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!cart.length) return alert("Корзина пустая. Добавьте блюда.");

  const userName = document.getElementById("user-name").value.trim();
  const userPhone = document.getElementById("user-phone").value.trim();
  const userAddress = document.getElementById("user-address").value.trim();
  if (!userName || !userPhone || !userAddress) return alert("Заполните имя, телефон и адрес.");

  const message = createWhatsAppMessage(userName, userPhone, userAddress);
  const encoded = encodeURIComponent(message);
  const whatsappNumber = cleanPhone(CONFIG.whatsappNumber);
  window.open(`https://wa.me/${whatsappNumber}?text=${encoded}`, "_blank");

  cart = [];
  promo = { code: "", discount: 0 };
  saveCart();
  savePromo();
  renderCart();
  updateMenuControls();
  document.getElementById("promo-code").value = "";
  document.getElementById("promo-hint").textContent = "";
  document.getElementById("order-form").reset();
  closeCart();
  showThanksModal();
});

loadCart();
loadPromo();
loadMenu();
renderCart();
if (promo.code) {
  document.getElementById("promo-code").value = promo.code;
  document.getElementById("promo-hint").textContent = "Промокод применен";
}
applyHeaderScrollState();
