const sqlInput = document.querySelector('.sql-input');
const executeBtn = document.querySelector('.execute-btn');
const resultSection = document.querySelector('.result-section');

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
        // Отправляем запрос на сервер
        const response = await fetch('/api/execute-sql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });
        
        const data = await response.json();
        
        // Показываем результат
        displayResult(data);
        
    } catch (error) {
        resultSection.innerHTML = '<p class="error-message">Ошибка сети: ' + error.message + '</p>';
    }
});

// Функция отображения результата
function displayResult(data) {
    if (data.error) {
        // Показываем ошибку
        resultSection.innerHTML = '<p class="error-message">Ошибка: ' + data.error + '</p>';
    } else {
        // Показываем успешный результат
        const results = data.results;
        
        if (Array.isArray(results) && results.length > 0) {
            // Создаём HTML таблицу
            let tableHTML = '<div class="results-container">';
            tableHTML += '<h3 class="results-title">Результаты запроса:</h3>';
            tableHTML += '<table class="results-table">';
            
            // Заголовки таблицы (названия столбцов)
            tableHTML += '<thead><tr class="table-header">';
            const columns = Object.keys(results[0]);
            columns.forEach(column => {
                tableHTML += `<th class="header-cell">${column}</th>`;
            });
            tableHTML += '</tr></thead>';
            
            // Строки с данными
            tableHTML += '<tbody>';
            results.forEach(row => {
                tableHTML += '<tr class="table-row">';
                columns.forEach(column => {
                    tableHTML += `<td class="data-cell">${row[column] || ''}</td>`;
                });
                tableHTML += '</tr>';
            });
            tableHTML += '</tbody>';
            
            tableHTML += '</table></div>';
            resultSection.innerHTML = tableHTML;
            
        } else {
            // Для INSERT/UPDATE/DELETE запросов
            resultSection.innerHTML = '<p class="success-message">Запрос выполнен успешно!</p>';
        }
    }
}

function setQuery(query) {
    sqlInput.value = query;
    sqlInput.focus(); 
}