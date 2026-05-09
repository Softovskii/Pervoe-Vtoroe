let menuData = [];
let cart = [];

async function loadMenu() {
    try {
        const response = await fetch(CONFIG.csvUrl);
        const data = await response.text();
        
        // Разбиваем таблицу на строки
        const rows = data.split('\n').map(row => row.split(','));
        const headers = rows[0].map(h => h.trim()); // Читаем заголовки из первой строки

        // Находим номера нужных колонок
        const iName = headers.indexOf('Наименование');
        const iPrice = headers.indexOf('Цена');
        const iCat = headers.indexOf('Категория');
        const iAvail = headers.indexOf('Наличие (Да/Нет)');

        menuData = rows.slice(1).map(row => {
            return {
                name: row[iName],
                price: parseInt(row[iPrice]),
                category: row[iCat],
                available: row[iAvail] ? row[iAvail].trim().toLowerCase() === 'да' : false
            };
        }).filter(item => item.name && item.available);

        renderCategories();
        renderMenu('Все');
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// Дальше функции renderCategories, renderMenu, addToCart, updateUI и оформление заказа 
// остаются такими же, как в первом сообщении.
