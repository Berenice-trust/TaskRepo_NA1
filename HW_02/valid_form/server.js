const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(express.static(__dirname));

// GET / - пустая форма
app.get('/', (req, res) => {
    sendForm(res);
});

// GET /submit - отправка формы
app.get('/submit', (req, res) => {
    const formData = req.query; // или req.body
    const errors = validateForm(formData); // вернет объект ошибок
    
    if (Object.keys(errors).length === 0) {
        // если нет ошибок в массиве, то отправляем успешную карточку
        sendSuccess(res, formData);
    } else {
        // если есть ошибки, то форму (с ошибками и старыми данными)
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
                <title>Опрос для тех кто старше 10 лет:</title>
                <link rel="stylesheet" href="/styles.css">
            </head>
            <body>
                <div class="container">
                    <h1>Опрос: <h1>
                    <h2>что вы думаете о котиках?</h2>
                    
                    <form class="form" method="get" action="/submit">
                        <div class="form-group">
                            <label for="name">Ваше имя:</label>
                            <input type="text" id="name" name="name" value="${formData.name || ''}">
                            ${errors.name ? `<div class="field-error">${errors.name}</div>` : ''}
                        </div>
                        
                        <div class="form-group">
                            <label for="age">Ваш возраст:</label>
                            <input type="text" id="age" name="age" value="${formData.age || ''}">
                            ${errors.age ? `<div class="field-error">${errors.age}</div>` : ''}
                        </div>
                        
                        <div class="form-group">
                            <label for="message">Мнение о котиках:</label>
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

// если форма успешно заполнена
function sendSuccess(res, formData) {
    res.send(`
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <title>Успешный ответ</title>
                <link rel="stylesheet" href="/styles.css">
            </head>
            <body>
                <div class="container">
                    <h1>Спасибо за ваше мнение!</h1>
                    
                    <div class="form-success">
                        <h3>Данные формы:</h3>
                        
                        <div class="data-item">
                            <strong>Имя:</strong> ${formData.name}
                        </div>
                        
                        <div class="data-item">
                            <strong>Возраст:</strong> ${formData.age} лет
                        </div>
                        
                        <div class="data-item message">
                            <strong>Мнение:</strong> 
                            <div class="message-text">${formData.message}</div>
                        </div>
                    </div>
                    
                    <a href="/">Отправить сообщение еще раз</a>
                </div>
            </body>
        </html>
    `);
}

// Валидация формы
function validateForm(formData) {
    const errors = {};
    
    // Имя
    if (!formData.name || formData.name.trim() === '') {
        errors.name = "Пожалуйста, укажите ваше имя";
    } else {
        const name = formData.name.trim();
        if (!/^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё-]*[A-Za-zА-Яа-яЁё]$/.test(name)) {
            errors.name = "Имя должно содержать только буквы и тире (-)";
        } else if (name.length < 3) {
            errors.name = "Имя должно содержать минимум 3 символа";
        }
    }
    
    // Возраст
    if (!formData.age || formData.age.trim() === '') {
        errors.age = "Укажите ваш возраст (число)";
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

// Запускаем сервер на порту 3001
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});