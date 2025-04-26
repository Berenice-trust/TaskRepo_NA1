const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');
const { 
  validateUrl, 
  validateKeyField, 
  validateValueField, 
  validateRequestBody 
} = require('./shared/validators'); // модуль валидации

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware для JSON и URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// для статических файлов
app.use(express.static(path.join(__dirname, 'client')));
app.use('/shared', express.static(path.join(__dirname, 'shared'))); //общие, там файл с валидацией


                  // сохранение запроса в saved_requests.json
function saveRequest(requestData) {
  const savedRequestsPath = path.join(__dirname, 'data', 'saved_requests.json');
                        
  // Создаем папку data, если она не существует
  if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
  }
                        
  let savedRequests = [];
  try {
    if (fs.existsSync(savedRequestsPath)) {
      const data = fs.readFileSync(savedRequestsPath, 'utf8');
      savedRequests = JSON.parse(data); //JSON в массив объектов
    }
  } catch (error) {
      console.error('Ошибка чтения файла сохраненных запросов:', error);
    }
                        
  // Добавляем запрос
  const newRequest = {
    id: Date.now(),   // уникальный Id, соответствует времени создания
    ...requestData,   // копирует все свойства из requestData
    timestamp: new Date().toISOString()
  };
                          
  // в начало массива
  savedRequests.unshift(newRequest);

  // Записываем обновленный список
  try {
    fs.writeFileSync(savedRequestsPath, JSON.stringify(savedRequests, null, 2));
  } catch (error) {
    console.error('Ошибка записи сохраненных запросов:', error);
  }
}


                      // прокси-сервер для обхода CORS   ИСПРАВЛЕНО

// .all - все запросы с точным ключом, с любыми методами
// .use - запросы которые начинаются с ключа
// поменяла на post
app.post('/proxy', async (req, res) => {
  try {
    const proxyRequest = req.body;
    const targetUrl = proxyRequest.url;
    const method = proxyRequest.method; // вместо req.method
    const requestHeaders = proxyRequest.headers || {};
    const requestBody = proxyRequest.body;

    // проверка методов запросов
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({ 
        error: 'Invalid request method', 
        message: `Метод ${method} не поддерживается. Допустимые методы: ${validMethods.join(', ')}`
      });
    }



    // валидация URL
    const urlValidation = validateUrl(targetUrl); //из shared/validators.js
    if (!urlValidation.valid) {
      return res.status(400).json({ error: urlValidation.message });
    }

    // Валидация параметров запроса (???? может и не нужна?)
    try {
      const urlObj = new URL(targetUrl);
      for (const [key, value] of urlObj.searchParams.entries()) {
        // проверка ключей в строке запроса
        const keyValidation = validateKeyField(key, 'param');
        if (!keyValidation.valid) {
          return res.status(400).json({ error: keyValidation.message });
        }

        // проверка значений
        const valueValidation = validateValueField(value, 'param');
        if (!valueValidation.valid) {
          return res.status(400).json({ error: valueValidation.message });
        }
      }
    } catch (error) {
      // URL уже валидирован выше
      console.error('Ошибка при проверке параметров URL:', error);
    }

    // Валидация пользовательских заголовков (??? возможно не надо?)
    for (const [key, value] of Object.entries(requestHeaders)) {
      if (key.toLowerCase().startsWith('x-')) {
        // пользовательские и нестандартные заголовки
        const keyValidation = validateKeyField(key, 'header');
        if (!keyValidation.valid) {
          return res.status(400).json({ error: keyValidation.message });
        }

        const valueValidation = validateValueField(value, 'header');
        if (!valueValidation.valid) {
          return res.status(400).json({ error: valueValidation.message });
        }
      }
    }

    console.log (`Запрос к ${targetUrl}`);

    //опции для запроса (пока пустой)
    const options = {
      method: method, // метод из тела запроса
      headers: requestHeaders   // заголовки из тела запроса
    };
    
      // PATCH про запас
    if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody) {

      // Валидация тела запроса (??? возможно не надо?)
      const contentType = requestHeaders['content-type'] || '';
      let bodyToValidate = '';
      
      if (typeof requestBody === 'object') {
        if (contentType.includes('application/x-www-form-urlencoded')) {
          bodyToValidate = new URLSearchParams(requestBody).toString();
        } else {
          bodyToValidate = JSON.stringify(requestBody); 
        }
      } else {
        bodyToValidate = requestBody.toString(); 
      }
      
      const bodyValidation = validateRequestBody(bodyToValidate, contentType);

      if (!bodyValidation.valid) {
        return res.status(400).json({ error: bodyValidation.message });
      }

      if (typeof requestBody === 'object') {
        // Для application/x-www-form-urlencoded
        if (requestHeaders['content-type'] && 
          requestHeaders['content-type'].includes('application/x-www-form-urlencoded')) {
          // НЕ преобразуем в JSON, оставляем как строку
          options.body = new URLSearchParams(requestBody).toString();
          console.log("Form data:", options.body);
        } else {
          // Для JSON и других форматов
          options.body = JSON.stringify(requestBody);
        }
      
        // Сохраняем Content-Type из исходного запроса
        if (requestHeaders['content-type']) {
          options.headers['content-type'] = requestHeaders['content-type'];
        }
      } else {
      // Для других типов данных
      options.body = requestBody;
      }
    }
    
    
    options.redirect = 'manual'; // Отключаем автоматическое следование по редиректам, чтобы обработать их вручную
    // Отправляем запрос к API
    const response = await fetch(targetUrl, options);
      





                // ИЗМЕНЕНИЯ
    
      
    // Получаем тело ответа
    let responseBody;
    // Проверяем Content-Type для определения типа ответа
    const contentType = response.headers.get('content-type') || '';







    // Если это изображение или бинарные данные, используем Buffer
    // if (contentType.includes('image/') || contentType.includes('application/octet-stream')) {
    //   const buffer = await response.buffer();
    //   responseBody = buffer.toString('base64');
    //   console.log("Обработан бинарный контент:", contentType);
    // } else {
    //   // Для текстовых данных используем text()
    //   responseBody = await response.text();
    //   console.log("Обработан текстовый контент:", contentType);
    // }

    // массив текстовых форматов
    const textContentTypes = [
      'text/', 
      'application/json', 
      'application/javascript', 
      'application/xml',
      'application/xhtml+xml',
      'application/x-www-form-urlencoded'
    ];

    const isTextContent = textContentTypes.some(type => contentType.includes(type));
    //some - хотя бы одно включение из массива

    if (isTextContent) {
      // Для текстовых данных используем text()
      responseBody = await response.text();
      console.log("Обработан текстовый контент:", contentType);
    } else {
      // Все остальное через Buffer
      const buffer = await response.buffer();
      responseBody = buffer.toString('base64');
      console.log("Обработан бинарный контент:", contentType);
    }









    
      const proxyResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers.raw(),
        body: responseBody
      }
    
    // Разрешаем CORS для всех 
    res.set('Access-Control-Allow-Origin', '*');
    res.json(proxyResponse);
      
 
    







  } catch (error) {
    console.error('Ошибка прокси-сервера:', error);
    res.status(500).json({ 
      error: 'Ошибка прокси-сервера', 
      message: error.message 
    });

  }

});


// API для получения сохраненных запросов
app.get('/api/saved-requests', (req, res) => {
  const savedRequestsPath = path.join(__dirname, 'data', 'saved_requests.json');
  
  try {
    if (fs.existsSync(savedRequestsPath)) {
      const data = fs.readFileSync(savedRequestsPath, 'utf8');
      res.json(JSON.parse(data));
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Ошибка чтения сохраненных запросов:', error);
    res.status(500).json({ error: 'Не удалось получить сохраненные запросы' });
  }
});


// API для сохранения запроса по кнопке
app.post('/api/save-request', (req, res) => {
  try {
    saveRequest(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка сохранения запроса:', error);
    res.status(500).json({ error: 'Не удалось сохранить запрос' });
  }
});






// Тест
app.get('/api/test', (req, res) => {
  res.json({ message: 'API сервер работает!' });
});

// Запуск сервера 3003
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://5.187.3.57:${PORT}`);
});


