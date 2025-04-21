// script.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('Postman клиент загружен');
    
    // 1. Получаем элементы формы
    const methodSelect = document.getElementById('method');
    const urlInput = document.getElementById('url');
    const paramsContainer = document.querySelector('.params-container');
    const headersContainer = document.querySelector('.headers-container');
    const bodySection = document.querySelector('.body-section');
    const requestBody = document.querySelector('.request-body');
    const contentTypeSelect = document.getElementById('contentType');
    
    // Кнопки
    const addParamBtn = document.querySelector('.add-param');
    const addHeaderBtn = document.querySelector('.add-header');
    const sendBtn = document.querySelector('.send-btn');
    const saveBtn = document.querySelector('.save-btn');
    const clearBtn = document.querySelector('.clear-btn');
    
    // Элементы ответа
    const responseSection = document.querySelector('.response');
    const statusCodeElement = document.querySelector('.status-code span');
    const responseHeadersList = document.querySelector('.response-headers');
    const responseBodyElement = document.querySelector('.response-body');

    // Инициализация - скрываем секцию ответа до первого запроса
    responseSection.style.display = 'none';
    
    // Начнем с базовой функциональности: показ/скрытие тела запроса
    function toggleRequestBodyVisibility() {
        // GET и DELETE обычно не имеют тела
        const methodsWithoutBody = ['GET', 'DELETE'];
        bodySection.style.display = methodsWithoutBody.includes(methodSelect.value) ? 'none' : 'block';
    }
    
    // Вызываем функцию при загрузке страницы
    toggleRequestBodyVisibility();
    
    // И при изменении метода
    methodSelect.addEventListener('change', toggleRequestBodyVisibility);
    
    console.log('Базовая инициализация завершена');
});