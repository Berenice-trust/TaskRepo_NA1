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
                // Разделяем заголовок и значение
                if (option.dataset.key && option.dataset.value) {
                    // Устанавливаем только имя заголовка без описания
                    this.value = option.dataset.key;
                    // Устанавливаем значение
                    valueInput.value = option.dataset.value;
                }
                break;
            }
        }
    });
        
        // Добавляем обработчик удаления
        headerRow.querySelector('.remove-btn').addEventListener('click', function() {
            headerRow.remove();
        });
        
        headersContainer.appendChild(headerRow);
    }

    // обработчик событий для кнопок
    addParamBtn.addEventListener('click', addParam);
    addHeaderBtn.addEventListener('click', addHeader);

    // Добавляем обработчики удаления для уже существующих строк
    document.querySelectorAll('.param-row .remove-btn, .header-row .remove-btn').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.param-row, .header-row').remove();
        });
    });
    
});