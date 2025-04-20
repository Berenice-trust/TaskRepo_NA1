const express = require('express');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = 3001;

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true })); // для post

// Функция для загрузки файлов html
function loadTemplate(templateName) {
    const filePath = path.join(__dirname, 'templates', `${templateName}.html`);
    return fs.readFileSync(filePath, 'utf8');
}

// Главная страница 
app.get('/', (req, res) => {
    const template = loadTemplate('main');
    res.send(template);
});

// первичное отображение формы
app.get('/form', (req, res) => {
    sendForm(res);
});

// массив правил валидации с помощью express-validator
const validationRules = [
    body('name')
        .trim()
        .notEmpty().withMessage('Пожалуйста, укажите ваше имя')
        .isLength({ min: 3 }).withMessage('Имя должно содержать минимум 3 символа')
        .matches(/^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё-]*[A-Za-zА-Яа-яЁё]$/).withMessage('Имя должно содержать только буквы и тире (-)'),
    body('age')
        .trim()
        .notEmpty().withMessage('Укажите ваш возраст (число)')
        .isInt({ min: 10, max: 100 }).withMessage('Возраст должен быть от 10 до 100 лет'),
    body('message')
        .trim()
        .isLength({ min: 10, max: 1000 }).withMessage('Сообщение должно содержать минимум 10 символов и не превышать 1000 символов')
];

// Сама форма заполненная
// app.post('/form', (req, res) => {
//     const formData = req.body; // данные из body
    
//     // Если параметров нет - первый вход 
//     if (Object.keys(formData).length === 0) {
//         sendForm(res);
//     } else {
//         // Если есть параметры 
//         const errors = validateForm(formData); //ищем ошибки
        
//         if (Object.keys(errors).length === 0) {
//             // если нет ошибок - успешная форма
//             sendSuccess(res, formData);
//         } else {
//             // если есть ошибки - форма с ошибками
//             sendForm(res, formData, errors);
//         }
//     }
// });

app.post('/form', validationRules, (req, res) => {
    const formData = req.body; // данные из body
    
    // Если параметров нет - первый вход 
    if (Object.keys(formData).length === 0) {
        sendForm(res);
    } else {
        // результаты валидации 
        const validationErrors = validationResult(req);
        
        if (validationErrors.isEmpty()) {
            // если нет ошибок - успешная форма
            sendSuccess(res, formData);
        } else {
            // если есть ошибки - форма с ошибками
            const errors = {};
            validationErrors.array().forEach(error => {
                errors[error.path] = error.msg;
            });
            sendForm(res, formData, errors);
        }
    }
});

// функция отправки формы
function sendForm(res, formData = {}, errors = {}) {
    let template = loadTemplate('form');
    
    // Значения полей с заменой
    template = template.replace('$[name]', formData.name || '');
    template = template.replace('$[age]', formData.age || '');
    template = template.replace('$[message]', formData.message || '');
    
    // Ошибки с заменой
    template = template.replace('$[nameError]', 
        errors.name ? `<div class="field-error">${errors.name}</div>` : '');
    template = template.replace('$[ageError]', 
        errors.age ? `<div class="field-error">${errors.age}</div>` : '');
    template = template.replace('$[messageError]', 
        errors.message ? `<div class="field-error">${errors.message}</div>` : '');
    
    res.send(template);
}

// функция успешной формы
function sendSuccess(res, formData) {
    let template = loadTemplate('success');
    
    // Значения полей
    template = template.replace('$[name]', formData.name);
    template = template.replace('$[age]', formData.age);
    template = template.replace('$[message]', formData.message);
    
    res.send(template);
}

// Валидация
// function validateForm(formData) {
//     const errors = {}; //сюда собираем ошибки
    
//     // имя
//     if (!formData.name || formData.name.trim() === '') {
//         errors.name = "Пожалуйста, укажите ваше имя";
//     } else {
//         const name = formData.name.trim();
//         if (!/^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё-]*[A-Za-zА-Яа-яЁё]$/.test(name)) {
//             errors.name = "Имя должно содержать только буквы и тире (-)";
//         } else if (name.length < 3) {
//             errors.name = "Имя должно содержать минимум 3 символа";
//         }
//     }
    
//     // возраст
//     if (!formData.age || formData.age.trim() === '') {
//         errors.age = "Укажите ваш возраст (число)";
//     } else {
//         const age = parseInt(formData.age);
//         if (isNaN(age)) {
//             errors.age = "Возраст должен быть числом";
//         } else if (age < 10 || age > 100) {
//             errors.age = "Возраст должен быть от 10 до 100 лет";
//         }
//     }
    
//     // Сообщение
//     if (!formData.message || formData.message.trim().length < 10) {
//         errors.message = "Сообщение должно содержать минимум 10 символов";
//     } else if (formData.message.length > 1000) {
//         errors.message = "Сообщение не должно превышать 1000 символов";
//     }
    
//     return errors;
// }

// старт на порте 3001
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://5.187.3.57:${PORT}`);
});
