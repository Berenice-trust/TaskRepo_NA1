require('dotenv').config(); // для работы с переменными окружения
const express = require('express');
const mysql = require('mysql2');
// const Handlebars = require('handlebars'); //шаблоны
const fs = require('fs'); 
const path = require('path'); 


// Подключение к MariaDB
const connection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD, // Пароль из переменной окружения
    //   database: 'learning_db',
    connectionLimit: 10,
    queueLimit: 0,
//   acquireTimeout: 60000,
    multipleStatements: true,
    waitForConnections: true,
  
});

// Обработка разрыва соединения
// connection.on('error', (err) => {
//   console.log('Ошибка соединения с БД:', err);
//   if(err.code === 'PROTOCOL_CONNECTION_LOST') {
//     console.log('Переподключение к БД...');
//     connection.connect(); // переподключение
//   }
// });

// Проверка подключения
// connection.connect((err) => {
//   if (err) {
//     console.error('Ошибка подключения к MariaDB:', err);
//     return;
//   }
//   console.log('Подключились к MariaDB!');
// });





const app = express();
const PORT = 3004;

app.use(express.static('client'));
app.use(express.json({ limit: '50mb' })); // увеличиваем лимит на размер JSON
//app.use(express.urlencoded({ limit: '50mb', extended: true })); 

// Тест
// app.get('/test', (req, res) => {
//   res.json({ message: 'Сервер работает!' });
// });

// Загружаем шаблон 
// const templatePath = path.join(__dirname, 'templates', 'results.handlebars');
// const templateSource = fs.readFileSync(templatePath, 'utf8');
// const resultsTemplate = Handlebars.compile(templateSource);


// API для получения шаблона для результатов
// app.post('/api/render-results', (req, res) => {
//   const { results, totalCount, isLimited } = req.body;
  
//    if (Array.isArray(results) && results.length > 0) {
//     const columns = Object.keys(results[0]);
    
//     const data = {
//       results: results,
//       columns: columns,
//       totalCount: totalCount || results.length,
//       isLimited: isLimited || false
//     };
    
//     const html = resultsTemplate(data);
//     res.json({ html });
//   } else {
//     res.json({ html: '<p class="success-message">Запрос выполнен успешно!</p>' });
//   }
// });



// API для получения шаблона
app.get('/api/template/results', (req, res) => {
  try {
    const templatePath = path.join(__dirname, 'templates', 'results.handlebars');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    res.json({ template: templateSource });
  } catch (error) {
    res.status(500).json({ error: 'Не удалось загрузить шаблон' });
  }
});

// API для получения списка баз данных
app.get('/api/databases', (req, res) => {
  connection.query('SHOW DATABASES', (err, results) => {
    if (err) {
      return res.json({ error: err.message });
    }
    
    // Фильтруем системные базы данных
    const databases = results
      .map(row => row.Database)
      .filter(db => !['information_schema', 'performance_schema', 'mysql', 'sys'].includes(db));
    
    res.json({ databases });
  });
});

// для SQL запросов
app.post('/api/execute-sql', (req, res) => {
  const { query, database } = req.body; 
    // короткая запись для const query = req.body.query;
  
  // если запрос пустой - ошибка
  if (!query) {
    return res.status(400).json({ error: 'SQL запрос не может быть пустым' });
  }

  if (!database) {
    return res.status(400).json({ error: 'Выберите базу данных' });
  }
  

  // Переключаемся на выбранную базу перед выполнением запроса
  const fullQuery = `USE \`${database}\`; ${query}`;
  

  //  SQL запрос
  connection.query(fullQuery, (err, results) => {
    if (err) {
      return res.json({ error: err.message });
    }

      // Если несколько запросов -> результат последнего
    const finalResult = Array.isArray(results) && results.length > 1 
      ? results[results.length - 1] 
      : results;

    res.json({ results: finalResult });
    

//   // Ограничу результат, а то когда слишком большой не грузится
//     if (Array.isArray(results) && results.length > 10000) {
//       const limitedResults = results.slice(0, 10000);
      
//       res.json({ 
//         results: limitedResults,
//         totalCount: results.length,
//         isLimited: true
//       });
//     } else {
//       res.json({ results });
//     }


   
  });
});






// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://5.187.3.57:${PORT}`);
});