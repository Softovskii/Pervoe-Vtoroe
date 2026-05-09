let menuData = [];
let cart = [];

async function loadMenu() {
    const grid = document.getElementById('menu-grid');
    try {
        const response = await fetch(CONFIG.csvUrl);
        const text = await response.text();
        
        // Разбиваем текст на строки
        const rows = text.split(/\r?\n/).filter(row => row.trim() !== "");
        
        // Читаем заголовки (первая строка)
        const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));

        // Определяем номера колонок
        const iName = headers.indexOf('Наименование');
        const iPrice = headers.indexOf('Цена');
        const iCat = headers.indexOf('Категория');
        const iAvail = headers.indexOf('Наличие (Да/Нет)');

        if (iName === -1) {
            grid.innerHTML = "<p>Ошибка: Колонки в таблице названы неверно.</p>";
            return;
        }

        menuData = rows.slice(1).map(row => {
            const columns = row.split(',').map(c => c.trim().replace(/"/g, ''));
            return {
                name: columns[iName],
                price: parseInt(columns[iPrice]) || 0,
                category: columns[iCat] || 'Меню',
                available: columns[iAvail] ? columns[iAvail].toLowerCase() === 'да' : false
            };
        }).filter(item => item.name && item.available);

        if (menuData.length === 0) {
            grid.innerHTML = "<p>Блюда не найдены. Проверьте колонку 'Наличие'!</p>";
        } else {
            renderCategories();
            renderMenu('Все');
        }
    } catch (error) {
        grid.innerHTML = "<p>Ошибка связи с таблицей.</p>";
    }
}

function renderCategories() {
    const categories = ['Все', ...new Set(menuData.map(item => item.category))];
    const nav = document.getElementById('categories');
    nav.innerHTML = categories.map(cat => `
        <button class="category-btn" onclick="renderMenu('${cat}')">${cat}</button>
    `).join('');
}

function renderMenu(category) {
    const grid = document.getElementById('menu-grid');
    const filtered = category === 'Все' ? menuData : menuData.filter(i => i.category === category);
    
    grid.innerHTML = filtered.map(item => `
        <div class="food-card">
            <div>
                <div class="food-name">${item.name}</div>
                <div class="food-price">${item.price} ₸</div>
            </div>
            <button class="btn-add" onclick="addToCart('${item.name}', ${item.price})">Добавить</button>
        </div>
    `).join('');

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText === category);
    });
}

function addToCart(name, price) {
    const existing = cart.find(i => i.name === name);
    if (existing) { existing.qty++; } else { cart.push({ name, price, qty: 1 }); }
    updateUI();
}

function updateUI() {
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const cartBtn = document.getElementById('cart-button');
    const cartCount = document.getElementById('cart-count');
    cartBtn.style.display = totalQty > 0 ? 'block' : 'none';
    cartCount.innerText = totalQty;

    const cartItems = document.getElementById('cart-items');
    let totalSum = 0;
    cartItems.innerHTML = cart.map((item, index) => {
        totalSum += item.price * item.qty;
        return `<div class="cart-item">
            <div style="flex:1">${item.name}</div>
            <div class="qty-controls" style="display:flex; align-items:center; gap:10px">
                <button type="button" onclick="changeQty(${index}, -1)">-</button>
                <span>${item.qty}</span>
                <button type="button" onclick="changeQty(${index}, 1)">+</button>
            </div>
            <div style="width:70px; text-align:right">${item.price * item.qty} ₸</div>
        </div>`;
    }).join('');
    document.getElementById('total-amount').innerText = totalSum;
}

function changeQty(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    updateUI();
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.style.display = (modal.style.display === 'block') ? 'none' : 'block';
}

document.getElementById('order-form').onsubmit = function(e) {
    e.preventDefault();
    const name = document.getElementById('user-name').value;
    const phone = document.getElementById('user-phone').value;
    const address = document.getElementById('user-address').value;
    let orderList = cart.map(i => `— ${i.name} x${i.qty}`).join('\n');
    let text = `Здравствуйте! Заказ:\n\nИмя: ${name}\nТелефон: ${phone}\nАдрес: ${address}\n\n${orderList}\n\nИтого: ${document.getElementById('total-amount').innerText}₸`;
    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
};

loadMenu();
