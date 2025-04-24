document.addEventListener('DOMContentLoaded', function() {

    // элементы из html
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

    // скрываем пока секцию ответа
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
    
    // при выборе другого метода опять проверяем показывать или нет тело запроса
    methodSelect.addEventListener('change', toggleRequestBodyVisibility);


    // Добавление параметра
    function addParam() {
        const paramRow = document.createElement('div');
        paramRow.className = 'param-row';
        
        paramRow.innerHTML = `
            <input type="text" class="param-key" placeholder="Ключ">
            <input type="text" class="param-value" placeholder="Значение">
            <button type="button" class="remove-btn">Удалить</button>
        `;
        
        // Добавляем обработчик удаления
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


    // добавление заголовка с подсказками
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
            <option value="Origin: http://5.187.3.57:3003" data-key="Origin" data-value="http://5.187.3.57:3003">
        </datalist>
        `;
        
        // привязываем поля к списку заголовков
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
            const options = headerRow.querySelectorAll('#common-headers option');
            
            for (const option of options) {
                if (option.value === selectedFullHeader) {
                    // отдельно ключ и значение
                    if (option.dataset.key && option.dataset.value) {
                        // устанавливаем имя заголовка
                        this.value = option.dataset.key;
                        // Устанавливаем значение
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

         // Добавляем валидацию значения заголовка
    valueInput.addEventListener('input', function() {
        const result = validators.validateValueField(this.value, 'header');
        if (!result.valid) {
            showError(this, result.message);
        } else {
            clearError(this);
        }
    });
        
        // Добавляем обработчик удаления
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


                                          // ВАЛИДАЦИЯ
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

    // Валидация при отправке запроса
    sendBtn.addEventListener('click', function(e) {
        //проверяем url
        const result = validators.validateUrl(urlInput.value);
        if (!result.valid) {
            e.preventDefault(); // Останавливаем отправку
            showError(urlInput, result.message);
            return;
        }

         // Проверка параметров
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






    if (!allValid) {
        e.preventDefault();
        return;
    }




        
        // запрос отправлен
        console.log('Все поля валидны, отправка запроса');
    });
        


    // инициализация для существующего в дом параметра
    document.querySelectorAll('.param-row').forEach(paramRow => {
        const keyInput = paramRow.querySelector('.param-key');
        if (keyInput) {
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
});