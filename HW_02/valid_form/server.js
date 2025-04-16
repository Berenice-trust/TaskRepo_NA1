const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Статические файлы из текущей директории
app.use(express.static(__dirname));

// GET / - отправка формы
app.get('/', (req, res) => {
    // Отправляем пустую форму
    sendForm(res);
});

// GET /submit - обработка отправки формы
app.get('/submit', (req, res) => {
    const formData = req.query; // или req.body для POST
    const errors = validateForm(formData);
    
    if (Object.keys(errors).length === 0) {
        // Если валидация успешна - показываем успешное сообщение
        sendSuccess(res, formData);
    } else {
        // Если есть ошибки - отправляем форму с ошибками
        sendForm(res, formData, errors);
    }
});

// Функция для отправки формы
function sendForm(res, formData = {}, errors = {}) {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Опрос</title>
            <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
            <div class="container">
                <h1>Форма опроса</h1>
                
                <form method="get" action="/submit">
                    <div class="form-group">
                        <label for="name">Имя:</label>
                        <input type="text" id="name" name="name" value="${formData.name || ''}">
                        ${errors.name ? `<div class="field-error">${errors.name}</div>` : ''}
                    </div>
                    
                    <div class="form-group">
                        <label for="age">Возраст:</label>
                        <input type="text" id="age" name="age" value="${formData.age || ''}">
                        ${errors.age ? `<div class="field-error">${errors.age}</div>` : ''}
                    </div>
                    
                    <div class="form-group">
                        <label for="message">Сообщение:</label>
                        <textarea id="message" name="message">${formData.message || ''}</textarea>
                        ${errors.message ? `<div class="field-error">${errors.message}</div>` : ''}
                    </div>
                    
                    <button type="submit">Отправить</button>
                </form>
            </div>
        </body>
        </html>
    `);
}

// Функция для отправки успешного результата
function sendSuccess(res, formData) {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Ответ отправлен</title>
            <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
            <div class="container">
                <h1>Ваш ответ принят</h1>
                
                <div class="success">
                    <h3>Данные формы:</h3>
                    
                    <div class="data-item">
                        <strong>Имя:</strong> ${formData.name}
                    </div>
                    
                    <div class="data-item">
                        <strong>Возраст:</strong> ${formData.age} лет
                    </div>
                    
                    <div class="data-item message">
                        <strong>Сообщение:</strong> 
                        <div class="message-text">${formData.message}</div>
                    </div>
                </div>
                
                <a href="/">Отправить сообщение еще раз</a>
            </div>
        </body>
        </html>
    `);
}

// Проверка формы на корректность заполнения
function validateForm(formData) {
    const errors = {};
    
    // Проверка имени
    if (!formData.name || formData.name.trim() === '') {
        errors.name = "Пожалуйста, укажите ваше имя";
    } else {
        const name = formData.name.trim();
        if (!/^[A-Za-zА-Яа-яЁё]+$/.test(name)) {
            errors.name = "Имя должно содержать только буквы";
        } else if (name.length < 3) {
            errors.name = "Имя должно содержать минимум 3 буквы";
        }
    }
    
    // Проверка возраста
    if (!formData.age || formData.age.trim() === '') {
        errors.age = "Укажите ваш возраст";
    } else {
        const age = parseInt(formData.age);
        if (isNaN(age)) {
            errors.age = "Возраст должен быть числом";
        } else if (age < 10 || age > 100) {
            errors.age = "Возраст должен быть от 10 до 100 лет";
        }
    }
    
    // Проверка сообщения
    if (!formData.message || formData.message.trim().length < 10) {
        errors.message = "Сообщение должно содержать минимум 10 символов";
    } else if (formData.message.length > 1000) {
        errors.message = "Сообщение не должно превышать 1000 символов";
    }
    
    return errors;
}

// Запускаем сервер
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});