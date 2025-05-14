document.addEventListener('DOMContentLoaded', function() {

    const methodSelect = document.getElementById('method');
    const urlInput = document.getElementById('url');
    const paramsContainer = document.querySelector('.params-container');
    const headersContainer = document.querySelector('.headers-container');
    const bodySection = document.querySelector('.body-section');
    const requestBody = document.querySelector('.request-body');
    const contentTypeSelect = document.getElementById('contentType');
    const addParamBtn = document.querySelector('.add-param');
    const addHeaderBtn = document.querySelector('.add-header');
    const sendBtn = document.querySelector('.send-btn');
    const saveBtn = document.querySelector('.save-btn');
    const clearBtn = document.querySelector('.clear-btn');
    const responseSection = document.querySelector('.response');
    const statusCodeElement = document.querySelector('.status-code span');
    const responseHeadersList = document.querySelector('.response-headers');
    const responseBodyElement = document.querySelector('.response-body');

    let isUpdatingUI = false;
    let currentRequestId = null; 
    let formChanged = false; // Флаг для отслеживания изменений в форме
    const updateBtn = document.querySelector('.update-btn');

        // Функция для управления состоянием кнопки "Обновить"
    function updateButtonState() {
        // Активируем кнопку только если есть ID запроса И форма была изменена
        updateBtn.disabled = !(currentRequestId && formChanged);
    }

    // Функция для добавления отслеживания изменений к элементу
    function addChangeTracker(element) {
        element.addEventListener('input', function() {
            formChanged = true;
            updateButtonState();
        });
        
        // Для селектов нужно использовать 'change' вместо 'input'
        if (element.tagName === 'SELECT') {
            element.addEventListener('change', function() {
                formChanged = true;
                updateButtonState();
            });
        }
    }

    // Добавляем отслеживание для основных полей
    addChangeTracker(methodSelect);
    addChangeTracker(urlInput);
    addChangeTracker(requestBody);
    addChangeTracker(contentTypeSelect);



    // скрываю секцию ответа
    responseSection.classList.add('hidden');
    

    // Функция для отображения модального окна подтверждения (вместо confirm)
    function showConfirmModal(message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmModalOverlay');
            const messageElement = document.getElementById('confirmMessage');
            const confirmBtn = document.getElementById('confirmBtn');
            const cancelBtn = document.getElementById('cancelBtn');
            
            messageElement.textContent = message;
            
            // Показываем модальное окно
            modal.classList.add('visible');
            
            // Обработчики для кнопок
            const handleConfirm = () => {
                modal.classList.remove('visible');
                cleanupListeners();
                setTimeout(() => resolve(true), 300); // Ждем завершения анимации
            };
            
            const handleCancel = () => {
                modal.classList.remove('visible');
                cleanupListeners();
                setTimeout(() => resolve(false), 300); // Ждем завершения анимации
            };
            
            // Очистка обработчиков событий
            const cleanupListeners = () => {
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
            };
            
            // Назначаем обработчики
            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
        });
    }

    // Скрытие тела запроса для get и delete    
    function toggleRequestBodyVisibility() {
        // GET и DELETE без тела
        const methodsWithoutBody = ['GET', 'DELETE'];

        if (methodsWithoutBody.includes(methodSelect.value)) {
            bodySection.classList.add('hidden');
        } else {
            bodySection.classList.remove('hidden');
        }
    }
    
    // инициализация функции
    toggleRequestBodyVisibility();
    
    // при выборе другого метода проверяем показывать ли тело запроса
    methodSelect.addEventListener('change', toggleRequestBodyVisibility);


    // Добавление строки параметров
    function addParam() {
        const paramRow = document.createElement('div');
        paramRow.className = 'param-row';
        paramRow.innerHTML = `
            <input type="text" class="param-key" placeholder="Имя параметра">
            <input type="text" class="param-value" placeholder="Значение параметра">
            <button type="button" class="remove-btn">Удалить</button>
        `;
        
        // удаление по кнопке удалить
        paramRow.querySelector('.remove-btn').addEventListener('click', function() {
            paramRow.remove();
        });

         // Валидация ключа параметра
        const keyInput = paramRow.querySelector('.param-key');
        keyInput.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                const result = validators.validateKeyField(this.value, 'param');
                if (!result.valid) {
                    showError(this, result.message);
                } else {
                    clearError(this);
                }
            } else {
                clearError(this);
            }
        });

         // Валидация значения параметра (хоть там особо ничего не валидируется,
         // проверяется на null и undefined)    
        const valueInput = paramRow.querySelector('.param-value');
        valueInput.addEventListener('input', function() {
            const result = validators.validateValueField(this.value, 'param');
            if (!result.valid) {
                showError(this, result.message);
            } else {
                clearError(this);
            }
        });

        addChangeTracker(paramRow.querySelector('.param-key'));
        addChangeTracker(paramRow.querySelector('.param-value'));

        paramsContainer.appendChild(paramRow);
    }

    // добавление строки заголовка с подсказками
    function addHeader() {
        const headerRow = document.createElement('div');
        headerRow.className = 'header-row';
        // Ходовые заголовки со значениями (datalist для подсказок)
        const headersDatalist = `
        <datalist id="common-headers">
            <option value="Accept: application/json" data-key="Accept" data-value="application/json">
            <option value="Accept: text/html" data-key="Accept" data-value="text/html">
            <option value="Accept: */*" data-key="Accept" data-value="*/*">
            <option value="Content-Type: application/json" data-key="Content-Type" data-value="application/json">
            <option value="Content-Type: application/x-www-form-urlencoded" data-key="Content-Type" data-value="application/x-www-form-urlencoded">
            <option value="Content-Type: multipart/form-data" data-key="Content-Type" data-value="multipart/form-data">
            <option value="Authorization: Bearer" data-key="Authorization" data-value="Bearer ">
            <option value="Authorization: Basic" data-key="Authorization" data-value="Basic ">
            <option value="User-Agent" data-key="User-Agent" data-value="PostmanClone/1.0">
            <option value="Cache-Control: no-cache" data-key="Cache-Control" data-value="no-cache">
            <option value="Cache-Control: max-age=0" data-key="Cache-Control" data-value="max-age=0">
            <option value="api-key: special-key" data-key="api-key" data-value="special-key">
            <option value="Origin: http://5.187.3.57:3003" data-key="Origin" data-value="http://5.187.3.57:3003">
        </datalist>
        `;
        // привязываем поля к списку заголовков (через list)
        headerRow.innerHTML = `
        ${headersDatalist}
        <input type="text" class="header-key" placeholder="Имя заголовка" list="common-headers">
        <input type="text" class="header-value" placeholder="Значение заголовка">
        <button type="button" class="remove-btn">Удалить</button>
        `;
        const keyInput = headerRow.querySelector('.header-key');
        const valueInput = headerRow.querySelector('.header-value');

        keyInput.addEventListener('change', function() {
            const selectedFullHeader = this.value;
            const datalist = headerRow.querySelector('datalist');
            const options = datalist.querySelectorAll('option');
            
            for (const option of options) {
                if (option.value === selectedFullHeader) {
                    // отдельно ключ и значение
                    if (option.dataset.key && option.dataset.value) {
                        
                        this.value = option.dataset.key;
                        valueInput.value = option.dataset.value;
                    }
                    break;
                }
            }
        });

        keyInput.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                const result = validators.validateKeyField(this.value, 'header');
                if (!result.valid) {
                    showError(this, result.message);
                } else {
                    clearError(this);
                }
            } else {
                clearError(this);
            }
        });

         // Валидируем значение заголовка
        valueInput.addEventListener('input', function() {
            const result = validators.validateValueField(this.value, 'header');
            if (!result.valid) {
                showError(this, result.message);
            } else {
                clearError(this);
            }
        });
        
        // удаление строки заголовка
        headerRow.querySelector('.remove-btn').addEventListener('click', function() {
            headerRow.remove();
        });

        addChangeTracker(headerRow.querySelector('.header-key'));
        addChangeTracker(headerRow.querySelector('.header-value'));
            
        headersContainer.appendChild(headerRow);
    }




    // обработчики для кнопок
    addParamBtn.addEventListener('click', addParam);
    addHeaderBtn.addEventListener('click', addHeader);

    // удаления строк
    document.querySelectorAll('.param-row .remove-btn, .header-row .remove-btn').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.param-row, .header-row').remove();
        });
    });




                                          // ВАЛИДАЦИЯ (логика в shared/validators.js)
    // отображаем ошибку
    function showError(element, message) {
        clearError(element);
        element.classList.add('error-field');
        
        // Создаем контейнер для ошибки
        const errorContainer = document.createElement('div');
        errorContainer.className = 'input-error-container';
        
        // Создаем сообщение об ошибке
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = message;
        
        // Вкладываем сообщение в контейнер
        errorContainer.appendChild(errorMessage);
        
        // Вставляем после всей строки параметра/заголовка
        const row = element.closest('.param-row, .header-row') || element.parentNode;
        row.appendChild(errorContainer);
    }

    // очищаем ошибку
    function clearError(element) {
        element.classList.remove('error-field');
    
    const row = element.closest('.param-row, .header-row') || element.parentNode;
    const errorContainer = row.querySelector('.input-error-container');
    if (errorContainer) {
        errorContainer.remove();
    }
    }

    // Валидация при вводе URL
    urlInput.addEventListener('input', function() {
        if (this.value.trim() !== '') {
            const result = validators.validateUrl(this.value);
            if (!result.valid) {
                showError(this, result.message);
            } else {
                clearError(this);
            }
        } else {
            clearError(this);
        }
    });


// Валидация тела запроса при изменении
    requestBody.addEventListener('input', function() {
    if (bodySection.classList.contains('hidden')) {
      return; // Не валидируем, если тело скрыто
    }
    
    const contentType = contentTypeSelect.value;
    const result = validators.validateRequestBody(this.value, contentType);
    
    if (!result.valid) {
      showError(this, result.message);
    } else {
      clearError(this);
    }
    });
  
  // Обновляем валидацию при смене Content-Type
    contentTypeSelect.addEventListener('change', function() {
    // Только если есть текст в поле тела запроса
    if (requestBody.value.trim() !== '') {
      const result = validators.validateRequestBody(requestBody.value, this.value);
      if (!result.valid) {
        showError(requestBody, result.message);
      } else {
        clearError(requestBody);
      }
    }
    });



                                        // нажатие кнопки ОТПРАВИТЬ

    sendBtn.addEventListener('click', async function(e) {
            //проверяем url
        const result = validators.validateUrl(urlInput.value);
        if (!result.valid) {
            e.preventDefault(); // Останавливаем отправку
            showError(urlInput, result.message);
            return;
        }

        let allValid = true;
        
        // Проверяем ключи параметров
        document.querySelectorAll('.param-row .param-key').forEach(input => {
            if (input.value.trim() !== '') {
                const result = validators.validateKeyField(input.value, 'param');
                if (!result.valid) {
                    showError(input, result.message);
                    allValid = false;
                }
            }
        });
        
        // Проверяем ключи заголовков
        document.querySelectorAll('.header-row .header-key').forEach(input => {
            if (input.value.trim() !== '') {
                const result = validators.validateKeyField(input.value, 'header');
                if (!result.valid) {
                    showError(input, result.message);
                    allValid = false;
                }
            }
        });

        // Проверяем значения параметров
        document.querySelectorAll('.param-row .param-value').forEach(input => {
            const result = validators.validateValueField(input.value, 'param');
            if (!result.valid) {
                showError(input, result.message);
                allValid = false;
            }
        });

        // Проверяем значения заголовков
        document.querySelectorAll('.header-row .header-value').forEach(input => {
            const result = validators.validateValueField(input.value, 'header');
            if (!result.valid) {
                showError(input, result.message);
                allValid = false;
            }
        });

        // Проверка тела запроса
        if (!bodySection.classList.contains('hidden')) {
            const contentType = contentTypeSelect.value;
            const bodyResult = validators.validateRequestBody(requestBody.value, contentType);
            
            if (!bodyResult.valid) {
            e.preventDefault();
            showError(requestBody, bodyResult.message);
            allValid = false;
            }
        }

        // Если есть ошибки, останавливаем отправку
        if (!allValid) {
            e.preventDefault();
            return;
        }
    
        // Реальная отправка запроса
        try {
            // меняем текст кнопки
            sendBtn.textContent = 'Отправляем...';
            sendBtn.disabled = true;
            
            //получаем из формы URL и метод
            let url = urlInput.value;
            const method = methodSelect.value;
            
            // Собираем параметры из формы
            const urlObj = new URL(url);
            document.querySelectorAll('.param-row').forEach(row => {
                const key = row.querySelector('.param-key').value.trim();
                const value = row.querySelector('.param-value').value.trim();
                if (key) {
                    urlObj.searchParams.set(key, value);
                }
            });
        
            // Собираем заголовки
            const headers = {};
            document.querySelectorAll('.header-row').forEach(row => {
                const key = row.querySelector('.header-key').value.trim();
                const value = row.querySelector('.header-value').value.trim();
                if (key) {
                    headers[key] = value;
                }
            });
        
            // собираем тело запроса (если нужно)
            let body = null;
            if (!bodySection.classList.contains('hidden') && requestBody.value.trim()) {
                body = requestBody.value;
                
                // Если это JSON, проверяем и форматируем
                if (contentTypeSelect.value === 'application/json') {
                    try {
                        body = JSON.stringify(JSON.parse(body));
                    } catch (e) {
                        // проверяется валидацией
                    }
                } else if (contentTypeSelect.value === 'application/x-www-form-urlencoded') {
                    
                    if (!body.includes('=')) {
                        try {
                            // Если это JSON, преобразуем в формат формы
                            const jsonData = JSON.parse(body);
                            //URLSearchParams - автоматически преобразует JSON-данные в формат формы
                            const params = new URLSearchParams();
                            for (const key in jsonData) {
                                params.append(key, jsonData[key]);
                            }
                            body = params.toString();
                        } catch (e) {
                            // Если не JSON, просто оставляем как есть
                        }
                    }
    
                }

                // Добавляем Content-Type, если его не установили вручную
                if (!headers['Content-Type']) {
                    headers['Content-Type'] = contentTypeSelect.value; //по умолчанию 'application/json' (сброс 680)
                }
            }






           
            
                                                    // ИСПРАВЛЕНИЕ
            // объект для отправки на прокси-сервер
            const proxyRequest = {
                method: method,           
                url: urlObj.toString(),   
                headers: headers,         
                body: ['GET', 'HEAD', 'DELETE'].includes(method) ? null : body,  // Тело для API
                params: []             
            };

            document.querySelectorAll('.param-row').forEach(row => {
                const key = row.querySelector('.param-key').value.trim();
                const value = row.querySelector('.param-value').value.trim();
                if (key) {
                    proxyRequest.params.push({ key, value });
                }
            });

            // отправляем POST запрос к /proxy
            const response = await fetch('/proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(proxyRequest)
            });

            // Получаем  ответ от прокси-сервера
            const responseData = await response.json();












                                                    // ИСПРАВЛЕНИЕ               
            // включаем видимость ответа
            responseSection.classList.remove('hidden');
        
            // Статус код ответа берем из responseData 
            statusCodeElement.textContent = responseData.status;
            statusCodeElement.className = '';
            statusCodeElement.classList.add(`status-${Math.floor(responseData.status/100)}xx`); //неудачные будут красными
            
            // Заголовки responseData.headers
            responseHeadersList.innerHTML = '';
            if (responseData.headers) {
                for (const [key, value] of Object.entries(responseData.headers)) {
                    const li = document.createElement('li');
                    li.textContent = `${key}: ${Array.isArray(value) ? value.join(', ') : value}`;
                    responseHeadersList.appendChild(li);
                }
            }
        
            // Тело ответа из responseData.body
            responseBodyElement.textContent = responseData.body || ''; //тело
        
            // пытаемся форматировать JSON
            try {
                const contentType = responseData.headers && 
                       (responseData.headers['Content-Type'] || 
                        responseData.headers['content-type']);

            // Преобразуем в строку, если это массив
            const contentTypeStr = Array.isArray(contentType) ? contentType[0] : contentType;
    
                
                if (contentTypeStr && contentTypeStr.includes('application/json') && responseData.body) {
                    // для JSON
                    const jsonData = JSON.parse(responseData.body);
                    responseBodyElement.textContent = JSON.stringify(jsonData, null, 2);





                                            //для картинки НОВОЕ
                } else if (contentTypeStr && contentTypeStr.includes('image/')) {
                    // отладка
                    // console.log("ОТЛАДКА: изображение");
                    // console.log("Тип контента:", contentTypeStr);
                    // console.log("Длина base64:", responseData.body.length);
                    // console.log("Начало base64:", responseData.body.substring(0, 20) + "...");
                    
                   // Создаем контейнер
                    const imageContainer = document.createElement('div');
                
                    // Hex представление (первые 100 байт)
                    try {
                        const binary = atob(responseData.body);
                        let hexString = '';
                        
                        // преобразуем бинарные данные в hex (16-тиричный формат)
                        for (let i = 0; i < Math.min(binary.length, 100); i++) {
                            const hex = binary.charCodeAt(i).toString(16).padStart(2, '0');
                            hexString += hex + ' ';
                            if ((i + 1) % 16 === 0) hexString += '\n';
                        }
                        
                        const hexView = document.createElement('div');
                        hexView.innerHTML = `
                            <h4>Шестнадцатеричное представление (первые 100 байт):</h4>
                            <pre class="img-preview">${hexString}</pre>
                        `;
                        imageContainer.appendChild(hexView);
                    } catch (e) {
                        console.error("Ошибка преобразования в hex:", e);
                    }
    
                    // Сама картинка
                    const imgView = document.createElement('div');
                    imgView.innerHTML = '<h4>Изображение:</h4>';
                    
                    const img = document.createElement('img');
                    img.src = `data:${contentTypeStr};base64,${responseData.body}`;
                    img.style.maxWidth = '100%';
                    img.style.marginTop = '10px';
                    img.onerror = () => console.error("Ошибка загрузки изображения");
                    
                    imgView.appendChild(img);
                    imageContainer.appendChild(imgView);
                    
                    // Очищаем и вставляем
                    responseBodyElement.textContent = '';
                    responseBodyElement.appendChild(imageContainer);
}
            } catch (e) {
                // Если не JSON, показываем как текст
            }
        
        






        
        } catch (error) {
            console.error('Ошибка отправки запроса:', error);
            responseSection.classList.remove('hidden');
            statusCodeElement.textContent = 'Error';
            statusCodeElement.className = 'error';
            responseBodyElement.textContent = `Ошибка: ${error.message}`;
        } finally {
            // восстанавливаем кнопку
            sendBtn.textContent = 'Отправить запрос';
            sendBtn.disabled = false;
        }
    });
        

                                        // нажатие кнопки СОХРАНИТЬ

    saveBtn.addEventListener('click', async function() {
        // данные запроса
        const requestData = {
            method: methodSelect.value,
            url: urlInput.value,
            params: [],
            headers: [],
            body: bodySection.classList.contains('hidden') ? '' : requestBody.value,
            contentType: contentTypeSelect.value
        };
        
        // Собираем параметры
        document.querySelectorAll('.param-row').forEach(row => {
            const key = row.querySelector('.param-key').value.trim();
            const value = row.querySelector('.param-value').value.trim();
            if (key) {
                requestData.params.push({ key, value });
            }
        });
        
        // Собираем заголовки
        document.querySelectorAll('.header-row').forEach(row => {
            const key = row.querySelector('.header-key').value.trim();
            const value = row.querySelector('.header-value').value.trim();
            if (key) {
                requestData.headers.push({ key, value });
            }
        });
        
        try {
            const response = await fetch('/api/save-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (response.ok) {
                showToast('Запрос сохранен', 'success');
                // Обновляем список запросов
                loadSavedRequests(true);
            } else {
                showToast('Ошибка при сохранении запроса', 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showToast('Ошибка при сохранении запроса', 'error');
        }
    });


    // обработчики кнопки "Обновить"
updateBtn.addEventListener('click', async function() {
    // Проверяем, что у нас есть ID запроса для обновления
    if (!currentRequestId) {
        showToast('Сначала загрузите запрос для обновления', 'info');
        return;
    }
    
    // Собираем данные запроса (так же как при сохранении)
    const requestData = {
        id: currentRequestId, // добавляем ID для идентификации запроса
        method: methodSelect.value,
        url: urlInput.value,
        params: [],
        headers: [],
        body: bodySection.classList.contains('hidden') ? '' : requestBody.value,
        contentType: contentTypeSelect.value
    };
    
    // Собираем параметры
    document.querySelectorAll('.param-row').forEach(row => {
        const key = row.querySelector('.param-key').value.trim();
        const value = row.querySelector('.param-value').value.trim();
        if (key) {
            requestData.params.push({ key, value });
        }
    });
    
    // Собираем заголовки
    document.querySelectorAll('.header-row').forEach(row => {
        const key = row.querySelector('.header-key').value.trim();
        const value = row.querySelector('.header-value').value.trim();
        if (key) {
            requestData.headers.push({ key, value });
        }
    });
    
    try {
        const response = await fetch(`/api/update-request/${currentRequestId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (response.ok) {
            formChanged = false; // Сбрасываем флаг изменений после успешного обновления
            updateBtn.disabled = true; // Деактивируем кнопку
            showToast('Запрос обновлен', 'success');
            // Обновляем список с принудительным обновлением
            loadSavedRequests(true);
        } else {
            showToast('Ошибка при обновлении запроса', 'error');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showToast('Ошибка при обновлении запроса', 'error');
    }
});



    // Функция для toast-уведомлений (всплывает справа внизу)
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`; // info, success, error
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // появляется плавно
        setTimeout(() => toast.classList.add('visible'), 10);
        
        // пропадает через 3 секунды
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }







        // Загрузка сохраненных запросов и отображение в списке
    async function loadSavedRequests(forceRefresh = false) {
        try {
            // временная метка для обхода кеша, если надо
            const url = forceRefresh 
                ? `/api/request-list-html?_t=${Date.now()}&currentId=${currentRequestId || ''}`
                : `/api/request-list-html?currentId=${currentRequestId || ''}`;

            // Запрашиваем HTML (с новым URL если forceRefresh=true)
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error! status: ${response.status}`);
            }

            // Получаем HTML и вставляем его в контейнер
            const html = await response.text();
            const historyList = document.querySelector('.history-list');
            historyList.innerHTML = html;

            // Добавляем обработчики событий для элементов списка
            document.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', async function(e) {
                    // Игнорируем клики по кнопке удаления
                    if (e.target.classList.contains('delete-btn')) {
                        return;
                    }

                    // Получаем ID запроса из атрибута data-id
                    const requestId = parseInt(this.getAttribute('data-id'));
                    
                    // Загружаем запрос по ID
                    try {
                        const response = await fetch('/api/saved-requests');
                        const requests = await response.json();
                        const request = requests.find(r => r.id === requestId);
                        
                        if (request) {
                            loadSavedRequest(request);  // Загружаем запрос в форму
                        }
                    } catch (error) {
                        console.error('Ошибка загрузки запроса:', error);
                    }
                });
            });

            // обработчик для кнопок удаления
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', async function(e) {
                    e.stopPropagation(); // Останавливаем всплытие, чтобы не срабатывал клик по элементу истории
                    
                    const requestId = this.getAttribute('data-id');
                    const confirmed = await showConfirmModal('Вы уверены, что хотите удалить этот запрос?');
        
                    if (confirmed) {
                        try {
                            const response = await fetch(`/api/delete-request/${requestId}`, {
                                method: 'DELETE'
                            });
                            
                            if (response.ok) {
                                // Если удаление прошло успешно, обновляем список
                                loadSavedRequests(true);
                                showToast('Запрос удален', 'success');
                            } else {
                                showToast('Ошибка при удалении запроса', 'error');
                            }
                        } catch (error) {
                            console.error('Ошибка при удалении запроса:', error);
                            showToast('Ошибка при удалении запроса', 'error');
                        }
                    }
                });
            });
            
        } catch (error) {
            console.error('Ошибка загрузки сохраненных запросов:', error);
        }
    }









    // заполняет данными форму сохраненного запроса
    function loadSavedRequest(request) {
         // Сохраняем ID загруженного запроса и активируем кнопку обновления
        currentRequestId = request.id;

        // Предотвращаем циклические вызовы
        if (!isUpdatingUI) {
            isUpdatingUI = true;
            loadSavedRequests(true); // обновляем список для отображения активного запроса
            isUpdatingUI = false;
        }
        // updateBtn.disabled = false;
        loadSavedRequests(true); // обновляем список чтобы отобразить активный запрос
        formChanged = false; // Сбрасываем флаг изменений при загрузке
        updateBtn.disabled = true; // Кнопка неактивна, пока нет изменений
        methodSelect.value = request.method;
        urlInput.value = request.url;
        
        // Очищаем параметры
        document.querySelectorAll('.param-row').forEach(row => {
            if (row !== paramsContainer.firstElementChild) {
                row.remove();
            } else {
                row.querySelector('.param-key').value = '';
                row.querySelector('.param-value').value = '';
            }
        });
        
        // Добавляем параметры сохраненного запроса
        if (request.params && request.params.length > 0) {
            const firstParam = request.params[0];
            const firstRow = paramsContainer.querySelector('.param-row');
            firstRow.querySelector('.param-key').value = firstParam.key;
            firstRow.querySelector('.param-value').value = firstParam.value;
            
            // Добавляем остальные параметры
            for (let i = 1; i < request.params.length; i++) {
                addParam();
                const rows = paramsContainer.querySelectorAll('.param-row');
                const lastRow = rows[rows.length - 1];
                lastRow.querySelector('.param-key').value = request.params[i].key;
                lastRow.querySelector('.param-value').value = request.params[i].value;
            }
        }
        
        // Очищаем заголовки
        document.querySelectorAll('.header-row').forEach(row => {
            row.remove();
        });
        
        // Добавляем заголовки из сохраненного запроса
        if (request.headers && request.headers.length > 0) {
            request.headers.forEach(header => {
                addHeader();
                const rows = headersContainer.querySelectorAll('.header-row');
                const lastRow = rows[rows.length - 1];
                lastRow.querySelector('.header-key').value = header.key;
                lastRow.querySelector('.header-value').value = header.value;
            });
        }
        
        // Устанавливаем тело запроса
        requestBody.value = request.body || '';
        
        // Устанавливаем Content-Type
        if (request.contentType) {
            contentTypeSelect.value = request.contentType;
        }
        
        // Обновляем видимость тела запроса
        toggleRequestBodyVisibility();
    }

    // инициализация для существующего в html параметра (чтобы срабатывала валидация)
    document.querySelectorAll('.param-row').forEach(paramRow => {
        const keyInput = paramRow.querySelector('.param-key');
        if (keyInput) {
            // при вводе
            keyInput.addEventListener('input', function() {
                if (this.value.trim() !== '') {
                    const result = validators.validateKeyField(this.value, 'param');
                    if (!result.valid) {
                        showError(this, result.message);
                    } else {
                        clearError(this);
                    }
                } else {
                    clearError(this);
                }
            });
        }
    });

    // Загружаем сохраненные запросы при загрузке страницы
    loadSavedRequests();


                                    // нажатие кнопки ОЧИСТИТЬ

    clearBtn.addEventListener('click', function() {

          // Сбрасываем ID текущего запроса и деактивируем кнопку
        currentRequestId = null;
        updateBtn.disabled = true;

        urlInput.value = '';
        methodSelect.value = 'GET';
        
        document.querySelectorAll('.param-row').forEach(row => {
            if (row !== paramsContainer.firstElementChild) {
                // что бы одна строка для параметров оставалась
                row.remove();
            } else {
                row.querySelector('.param-key').value = '';
                row.querySelector('.param-value').value = '';
            }
        });
        
        // Удаляем все заголовки
        document.querySelectorAll('.header-row').forEach(row => {
            row.remove();
        });
        
        // Очищаем все что есть или возвращаем значения по умолчанию
        requestBody.value = '';
        contentTypeSelect.value = 'application/json';
        responseSection.classList.add('hidden');

        // обновляем видимость тела запроса
        toggleRequestBodyVisibility();
        
        // Очищаем ошибки
        document.querySelectorAll('.error-field').forEach(field => {
            clearError(field);
        });
    });

});