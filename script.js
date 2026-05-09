let menuData = [];
let cart = [];

async function loadMenu() {
    const grid = document.getElementById('menu-grid');
    try {
        const response = await fetch(CONFIG.csvUrl);
        const text = await response.text();
        
        // Разбиваем текст на строки и убираем пустые
        const rows = text.split(/\r?\n/).filter(row => row.trim() !== "");
        
        // Читаем заголовки (первая строка)
        const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));

        // Определяем номера колонок
        const iName = headers.indexOf('Наименование');
        const iPrice = headers.indexOf('Цена');
        const iCat = headers.indexOf('Категория');
        const iAvail = headers.indexOf('Наличие (Да/Нет)');

        if (iName === -1) {
            grid.innerHTML = "<p>Ошибка: Колонки в таблице названы неверно. Проверьте первую строку!</p>";
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
            grid.innerHTML = "<p>Блюда не найдены. Проверьте, что в колонке Наличие написано 'Да'</p>";
        } else {
            renderCategories();
            renderMenu('Все');
        }
    } catch (error) {
        grid.innerHTML = "<p>Ошибка связи с таблицей. Проверьте ссылку в config.js</p>";
    }
}

// ... (остальные функции renderCategories, renderMenu и т.д. остаются из прошлого сообщения)
// Скопируй их из моего предыдущего длинного ответа и вставь ниже
