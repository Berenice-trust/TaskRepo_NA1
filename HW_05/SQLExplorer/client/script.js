const sqlInput = document.querySelector('.sql-input');
const executeBtn = document.querySelector('.execute-btn');
const resultSection = document.querySelector('.result-section');


// для шаблона
let resultsTemplate = null;

// Загрузка шаблона Handlebars
async function loadTemplate() {
  try {
    const response = await fetch('/api/template/results');
    const data = await response.json();
    resultsTemplate = Handlebars.compile(data.template);
    console.log('Шаблон загружен!');
  } catch (error) {
    console.error('Ошибка загрузки шаблона:', error);
  }
}

loadTemplate();






// Обработчик кнопки Выполнить
executeBtn.addEventListener('click', async () => {
    const query = sqlInput.value.trim();
    
    // Проверяем что запрос не пустой
    if (!query) {
        resultSection.innerHTML = '<p class="error-message">Введите SQL запрос!</p>';
        return;
    }
    
    // Загрузка...
    resultSection.innerHTML = '<p class="loading-message">Выполняется запрос...</p>';
    
    try {
        // запрос на сервер
        const response = await fetch('/api/execute-sql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });
        
        const data = await response.json();
        
        // результат
        displayResult(data);
        
    } catch (error) {
        resultSection.innerHTML = '<p class="error-message">Ошибка сети: ' + error.message + '</p>';
    }
});

// Функция отображения результата
async function displayResult(data) {
    if (data.error) {
        resultSection.innerHTML = '<p class="error-message">Ошибка: ' + data.error + '</p>';
        return;
    } 
    
    const results = data.results;
    
    if (Array.isArray(results) && results.length > 0) {
        if (!resultsTemplate) {
            resultSection.innerHTML = '<p class="error-message">Шаблон не загружен</p>';
            return;
        }
        
        // Подготавливаем данные для шаблона
        const columns = Object.keys(results[0]);
        const templateData = {
            results: results,
            columns: columns,
            totalCount: results.length,
            isLimited: false
        };
        
        // Рендерим HTML через Handlebars
        const html = resultsTemplate(templateData);
        resultSection.innerHTML = html;
        
    } else {
        resultSection.innerHTML = '<p class="success-message">Запрос выполнен успешно!</p>';
    }
    
    
}





// Функция отображения результата по простому.... без шаблонов
// function displayResult(data) {
//     if (data.error) {
//         // ошибка
//         resultSection.innerHTML = '<p class="error-message">Ошибка: ' + data.error + '</p>';
//     } else {
//         // успешный результат
//         const results = data.results;
        
//         if (Array.isArray(results) && results.length > 0) {
//             // HTML таблица
//             let tableHTML = '<div class="results-container">';
//             tableHTML += '<h3 class="results-title">Результаты запроса:</h3>';
//             tableHTML += '<table class="results-table">';
            
//             // Заголовки таблицы (названия столбцов)
//             tableHTML += '<thead><tr class="table-header">';
//             const columns = Object.keys(results[0]);
//             columns.forEach(column => {
//                 tableHTML += `<th class="header-cell">${column}</th>`;
//             });
//             tableHTML += '</tr></thead>';
            
//             // Строки с данными
//             tableHTML += '<tbody>';
//             results.forEach(row => {
//                 tableHTML += '<tr class="table-row">';
//                 columns.forEach(column => {
//                     tableHTML += `<td class="data-cell">${row[column] || ''}</td>`;
//                 });
//                 tableHTML += '</tr>';
//             });
//             tableHTML += '</tbody>';
            
//             tableHTML += '</table></div>';
//             resultSection.innerHTML = tableHTML;
            
//         } else {
//             resultSection.innerHTML = '<p class="success-message">Запрос выполнен успешно!</p>';
//         }
//     }
// }

function setQuery(query) {
    sqlInput.value = query;
    sqlInput.focus(); 
}