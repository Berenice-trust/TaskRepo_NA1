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

    // скрываю секцию ответа
    responseSection.classList.add('hidden');
    
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

            // формируем строку запроса через наш прокси-сервер
            const proxyUrl = `/proxy?url=${encodeURIComponent(urlObj.toString())}`;
            //encodeURIComponent - безопасно кодирует

            const options = {
                method: method,
                headers: headers,
                body: body && ['GET', 'HEAD', 'DELETE'].includes(method) ? null : body
                //методы без тела: GET, HEAD (про запас), DELETE
            };
        
            // Отправляем запрос, вернет статус и заголовки
            const response = await fetch(proxyUrl, options);
            
            // Получаем текст ответа, получаем тело ответа
            const responseData = await response.text();
            
            // включаем видимость ответа
            responseSection.classList.remove('hidden');
        
            // Статус код ответа
            statusCodeElement.textContent = response.status;
            statusCodeElement.className = '';
            statusCodeElement.classList.add(`status-${Math.floor(response.status/100)}xx`); //неудачные будут красными
            
            // Заголовки
            responseHeadersList.innerHTML = '';
            for (const [key, value] of response.headers.entries()) {
                const li = document.createElement('li');
                li.textContent = `${key}: ${value}`;
                responseHeadersList.appendChild(li);
            }
        
            // Тело ответа
            responseBodyElement.textContent = responseData; //тело
        
            // пытаемся форматировать JSON
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const jsonData = JSON.parse(responseData);
                    responseBodyElement.textContent = JSON.stringify(jsonData, null, 2);
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
            } else {
                showToast('Ошибка при сохранении запроса', 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showToast('Ошибка при сохранении запроса', 'error');
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
    async function loadSavedRequests() {
        try {
            const response = await fetch('/api/saved-requests');
            if (response.ok) {
                const savedRequests = await response.json();
                const historyContainer = document.querySelector('.history-list');
                
                // Очищаем существующие элементы
                historyContainer.innerHTML = '';
                
                // Добавляем новые
                savedRequests.forEach(request => {
                    const historyItem = document.createElement('div');
                    historyItem.className = `history-item ${request.method.toLowerCase()}`;
                    
                    historyItem.innerHTML = `
                        <div>${request.method}</div>
                        <div>${request.url}</div>
                    `;
                    
                    // Добавляем обработчик клика для загрузки запроса
                    historyItem.addEventListener('click', function() {
                        loadSavedRequest(request);
                    });
                    
                    historyContainer.appendChild(historyItem);
                });
            }
        } catch (error) {
            console.error('Ошибка загрузки сохраненных запросов:', error);
        }
    }

    // заполняет данными форму сохраненного запроса
    function loadSavedRequest(request) {
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