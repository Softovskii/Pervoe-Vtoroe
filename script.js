let menuData = [];
let cart = [];
let activeCategory = "Все";
const placeholderImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80";

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

function openCart() {
  document.getElementById("cart-modal").classList.add("show");
}

function closeCart() {
  document.getElementById("cart-modal").classList.remove("show");
}

function updateCartButton() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const btn = document.getElementById("cart-button");
  const countEl = document.getElementById("cart-count");

  countEl.textContent = count;
  btn.style.display = count > 0 ? "inline-flex" : "none";
}

function addToCart(item) {
  const found = cart.find((x) => x.name === item.name);
  if (found) {
    found.qty += 1;
  } else {
    cart.push({
      name: item.name,
      price: item.price,
      qty: 1,
      weight: item.weight,
      calories: item.calories
    });
  }
  renderCart();
}

function changeQty(name, delta) {
  const found = cart.find((x) => x.name === name);
  if (!found) return;

  found.qty += delta;
  if (found.qty <= 0) {
    cart = cart.filter((x) => x.name !== name);
  }
  renderCart();
}

function removeFromCart(name) {
  cart = cart.filter((x) => x.name !== name);
  renderCart();
}

function renderCategories() {
  const categoriesEl = document.getElementById("categories");
  const categories = ["Все", ...new Set(menuData.map((item) => item.category))];

  categoriesEl.innerHTML = categories
    .map(
      (cat) => `
      <button class="category-btn ${cat === activeCategory ? "active" : ""}" data-category="${cat}">
        ${cat}
      </button>
    `
    )
    .join("");

  categoriesEl.querySelectorAll(".category-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.category;
      renderCategories();
      renderMenu();
    });
  });
}

function renderMenu() {
  const grid = document.getElementById("menu-grid");

  const filtered =
    activeCategory === "Все"
      ? menuData
      : menuData.filter((item) => item.category === activeCategory);

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="status">В этой категории пока нет блюд.</p>';
    return;
  }

  grid.innerHTML = filtered
    .map(
      (item) => `
      <article class="food-card">
        <img
          class="food-image"
          src="${escapeHtml(item.photo || placeholderImage)}"
          alt="${escapeHtml(item.name)}"
          loading="lazy"
          onerror="this.src='${placeholderImage}'"
        />
        <div>
          <h3 class="food-title">${item.name}</h3>
          <p class="food-category">${item.category}</p>
          <p class="food-meta">${item.weight || "—"} • ${item.calories || "—"} ккал</p>
        </div>
        <div class="food-footer">
          <div class="food-price">${money(item.price)}</div>
          <button class="btn-add" data-name="${item.name}">Добавить</button>
        </div>
      </article>
    `
    )
    .join("");

  grid.querySelectorAll(".btn-add").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = menuData.find((x) => x.name === btn.dataset.name);
      if (item) addToCart(item);
    });
  });
}

function renderCart() {
  const cartItems = document.getElementById("cart-items");
  const totalEl = document.getElementById("total-amount");

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="status">Корзина пока пустая.</p>';
    totalEl.textContent = "0";
    updateCartButton();
    return;
  }

  cartItems.innerHTML = cart
    .map((item) => {
      const sum = item.price * item.qty;
      return `
      <div class="cart-item">
        <div class="cart-item-top">
          <span class="cart-item-name">${item.name}</span>
          <strong>${money(sum)}</strong>
        </div>
        <div class="cart-controls">
          <div class="qty-box">
            <button class="qty-btn" data-action="minus" data-name="${item.name}">-</button>
            <span>${item.qty}</span>
            <button class="qty-btn" data-action="plus" data-name="${item.name}">+</button>
          </div>
          <button class="remove-btn" data-action="remove" data-name="${item.name}">Удалить</button>
        </div>
      </div>
    `;
    })
    .join("");

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  totalEl.textContent = Number(total).toLocaleString("ru-RU");

  cartItems.querySelectorAll("button").forEach((btn) => {
    const { action, name } = btn.dataset;
    btn.addEventListener("click", () => {
      if (action === "plus") changeQty(name, 1);
      if (action === "minus") changeQty(name, -1);
      if (action === "remove") removeFromCart(name);
    });
  });

  updateCartButton();
}

function createWhatsAppMessage(userName, userPhone, userAddress) {
  const orderLines = cart
    .map((item) => `- ${item.name} x${item.qty} \"${money(item.price * item.qty)}\"`)
    .join("\n");
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return `Здравствуйте!\nХочу оформить заказ.\nИмя: ${userName}\nТелефон: ${userPhone}\nАдрес: ${userAddress}\nЗаказ:\n${orderLines}\n\nИтого: ${money(total)}`;
}

function cleanPhone(phone) {
  return String(phone).replace(/\D/g, "");
}

async function loadMenu() {
  const grid = document.getElementById("menu-grid");

  try {
    const response = await fetch(CONFIG.csvUrl, { redirect: "follow" });
    if (!response.ok) {
      throw new Error(`Не удалось загрузить CSV (код ${response.status})`);
    }

    const text = await response.text();
    const rows = text.split(/\r?\n/).filter((line) => line.trim() !== "");

    if (rows.length < 2) {
      throw new Error("CSV пустой или нет строк с блюдами");
    }

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

    function findIndexByAliases(key) {
      return cleanHeaders.findIndex((header) => aliases[key].includes(header));
    }

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
        category: cols[iCategory] || "Без категории",
        available: ["true", "да", "yes", "1"].includes(String(cols[iAvailable] || "").trim().toLowerCase()),
        photo: iPhoto >= 0 ? cols[iPhoto] : "",
        weight: iWeight >= 0 ? cols[iWeight] : "",
        calories: iCalories >= 0 ? cols[iCalories] : ""
      }))
      .filter((item) => item.name && item.available);

    if (menuData.length === 0) {
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
document.getElementById("close-modal").addEventListener("click", closeCart);
document.getElementById("cart-modal").addEventListener("click", (e) => {
  if (e.target.id === "cart-modal") closeCart();
});

document.getElementById("order-form").addEventListener("submit", (e) => {
  e.preventDefault();

  if (cart.length === 0) {
    alert("Корзина пустая. Добавьте блюда.");
    return;
  }

  const userName = document.getElementById("user-name").value.trim();
  const userPhone = document.getElementById("user-phone").value.trim();
  const userAddress = document.getElementById("user-address").value.trim();

  if (!userName || !userPhone || !userAddress) {
    alert("Заполните имя, телефон и адрес.");
    return;
  }

  const message = createWhatsAppMessage(userName, userPhone, userAddress);
  const encoded = encodeURIComponent(message);
  const whatsappNumber = cleanPhone(CONFIG.whatsappNumber);

  const url = `https://wa.me/${whatsappNumber}?text=${encoded}`;
  window.open(url, "_blank");
});

loadMenu();
renderCart();
