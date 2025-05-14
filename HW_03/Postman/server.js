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


// Обработка необработанных исключений
process.on('uncaughtException', (err) => {
  console.error('Необработанное исключение:', err);
  // Не завершаем процесс, чтобы PM2 мог корректно перезапустить
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Необработанное отклонение Promise:', reason);
});

const exphbs = require('express-handlebars'); // шаблонизатор

const app = express();
const PORT = process.env.PORT || 3003;


// Настройка Handlebars
const hbs = exphbs.create({
  extname: '.handlebars',   // расширение файлов шаблонов, можно .hbs
  defaultLayout: false, // без layout
  helpers: { // для toLowerCase
    toLowerCase: function(str) {
      return str.toLowerCase();
    },
    isEqual: function(a, b) { // для сравнения
      return a === b;
    }
  }
});

// для использования Handlebars
app.engine('handlebars', hbs.engine); //движок
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));
// Умное кеширование: только в production режиме
app.set('view cache', process.env.NODE_ENV === 'production');


// Middleware для JSON и URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// для статических файлов
app.use(express.static(path.join(__dirname, 'client')));
app.use('/shared', express.static(path.join(__dirname, 'shared'))); //общие, там файл с валидацией

// Отключение кеширования для всех ответов
// app.use((req, res, next) => {
//   res.set({
//     'Cache-Control': 'no-cache, no-store, must-revalidate',
//     'Pragma': 'no-cache',
//     'Expires': '0'
//   });
//   next();
// });

                  // сохранение запроса в saved_requests.json
// Заменить функцию saveRequest на:

function saveRequest(requestData) {
  return new Promise((resolve, reject) => {
    const savedRequestsPath = path.join(__dirname, 'data', 'saved_requests.json');
    
    // Создаем папку data, если она не существует (асинхронно)
    fs.mkdir(path.join(__dirname, 'data'), { recursive: true }, (err) => {
      if (err && err.code !== 'EEXIST') {
        console.error('Ошибка создания директории:', err);
        return reject(err);
      }
      
      // Чтение файла асинхронно
      fs.readFile(savedRequestsPath, 'utf8', (err, data) => {
        let savedRequests = [];
        
        if (!err) {
          try {
            savedRequests = JSON.parse(data);
          } catch (parseErr) {
            console.error('Ошибка парсинга JSON:', parseErr);
          }
        }
        
        const newRequest = {
          id: Date.now(),
          ...requestData,
          timestamp: new Date().toISOString()
        };
        
        savedRequests.unshift(newRequest);
        
        // Запись в файл асинхронно
        fs.writeFile(savedRequestsPath, JSON.stringify(savedRequests, null, 2), (err) => {
          if (err) {
            console.error('Ошибка записи сохраненных запросов:', err);
            return reject(err);
          }
          resolve(newRequest);
        });
      });
    });
  });
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

// новый эендпоинт для списка сохраненных запросов, вернет HTML
// Используем Handlebars 
app.get('/api/request-list-html', (req, res) => {
  const savedRequestsPath = path.join(__dirname, 'data', 'saved_requests.json');
  
  try {
    // получаем информацию из файла (размер и дату модификации) для кеширования
    //const stats = fs.statSync(savedRequestsPath);
    //const lastModified = stats.mtime.toUTCString(); // дата модификации
    
    //Создаем Etag для кеширования (из размера и времени модификации)
    //const etag = `"${stats.size}-${Date.parse(lastModified)}"`; 
    
     // Проверяем, тот же ETag у клиента
     //if (req.headers['if-none-match'] === etag) {
      // Если контент не изменился, возвращаем 304 Not Modified
      //return res.status(304).end();

      // загрузка данных из файла
      let requests = [];
      if (fs.existsSync(savedRequestsPath)) {
        const data = fs.readFileSync(savedRequestsPath, 'utf8');
        requests = JSON.parse(data);
      }

       // заголовки для кеширования
    // res.set({
    //   'Cache-Control': 'no-cache, no-store, must-revalidate',
    //   'Pragma': 'no-cache',
    //   'Expires': '0'
    // }); 
      
    // Получаем ID текущего запроса
    const currentId = parseInt(req.query.currentId) || null;
      // Рендерим шаблон для handlebars, передаем currentId
      res.render('partials/request-list', { 
        requests: requests,
        currentId: currentId,
        layout: false
      });

  } catch (error) {
    console.error('Ошибка получения списка запросов:', error);
    res.status(500).send('<div class="error">Ошибка загрузки списка запросов</div>');
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
app.post('/api/save-request', async (req, res) => {
  try {
    const requestData = req.body;

    const newRequest = await saveRequest(req.body); // сохраняем результат
    
    res.json({ success: true, id: newRequest.id });
  } catch (error) {
    console.error('Ошибка сохранения запроса:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// API для удаления запроса
app.delete('/api/delete-request/:id', (req, res) => {
  const requestId = parseInt(req.params.id);
  const savedRequestsPath = path.join(__dirname, 'data', 'saved_requests.json');
  
  try {
    // Проверяем существование файла
    if (!fs.existsSync(savedRequestsPath)) {
      return res.status(404).json({ error: 'Файл с запросами не найден' });
    }
    
    // Читаем текущий список запросов
    const data = fs.readFileSync(savedRequestsPath, 'utf8');
    let requests = JSON.parse(data);
    
    // Ищем запрос с указанным ID
    const requestIndex = requests.findIndex(request => request.id === requestId);
    
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Запрос не найден' });
    }
    
    // Удаляем запрос из массива
    requests.splice(requestIndex, 1);
    
    // Записываем обновленный список обратно в файл
    fs.writeFileSync(savedRequestsPath, JSON.stringify(requests, null, 2));
    
    res.json({ success: true, message: 'Запрос успешно удален' });
  } catch (error) {
    console.error('Ошибка при удалении запроса:', error);
    res.status(500).json({ error: 'Не удалось удалить запрос', message: error.message });
  }
});

// для обновления существующего запроса
app.put('/api/update-request/:id', (req, res) => {
  const requestId = parseInt(req.params.id);
  const updatedRequest = req.body;
  const savedRequestsPath = path.join(__dirname, 'data', 'saved_requests.json');
  
  try {
    // Проверяем существование файла
    if (!fs.existsSync(savedRequestsPath)) {
      return res.status(404).json({ error: 'Файл с запросами не найден' });
    }
    
    // Читаем текущий список запросов
    const data = fs.readFileSync(savedRequestsPath, 'utf8');
    let requests = JSON.parse(data);
    
    // Ищем запрос с указанным ID
    const requestIndex = requests.findIndex(request => request.id === requestId);
    
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Запрос не найден' });
    }
    
    // Обновляем запрос, сохраняя timestamp создания
    updatedRequest.timestamp = requests[requestIndex].timestamp;
    requests[requestIndex] = updatedRequest;
    
    // Записываем обновленный список обратно в файл
    fs.writeFileSync(savedRequestsPath, JSON.stringify(requests, null, 2));
    
    res.json({ success: true, message: 'Запрос успешно обновлен' });
  } catch (error) {
    console.error('Ошибка при обновлении запроса:', error);
    res.status(500).json({ error: 'Не удалось обновить запрос', message: error.message });
  }
});

// Тест
app.get('/api/test', (req, res) => {
  res.json({ message: 'API сервер работает!' });
});

// Запуск сервера 3003
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер запущен на http://5.187.3.57:${PORT}`);
});

// Обработка сигналов завершения для корректного освобождения порта
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Функция корректного завершения работы
function gracefulShutdown() {
  console.log('Получен сигнал завершения, закрываем сервер...');
  server.close(() => {
    console.log('Сервер успешно закрыт');
    process.exit(0);
  });
  
  // Если сервер зависнет, принудительное завершение через 5 секунд
  setTimeout(() => {
    console.error('Не удалось закрыть сервер корректно, принудительное завершение');
    process.exit(1);
  }, 5000);
}