require('dotenv').config(); // для работы с переменными окружения
const express = require('express');
const mysql = require('mysql2');


// Подключение к MariaDB
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PASSWORD, // Пароль из переменной окружения
  database: 'learning_db'
});

// Обработка разрыва соединения
connection.on('error', (err) => {
  console.log('Ошибка соединения с БД:', err);
  if(err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Переподключение к БД...');
    connection.connect(); // переподключение
  }
});

// Проверка подключения
connection.connect((err) => {
  if (err) {
    console.error('Ошибка подключения к MariaDB:', err);
    return;
  }
  console.log('Подключились к MariaDB!');
});





const app = express();
const PORT = 3004;

app.use(express.static('client'));
app.use(express.json()); //json в js объекты

// Тест
app.get('/test', (req, res) => {
  res.json({ message: 'Сервер работает!' });
});


// для SQL запросов
app.post('/api/execute-sql', (req, res) => {
  const { query } = req.body; 
    // короткая запись для const query = req.body.query;
  
  // если запрос пустой - ошибка
  if (!query) {
    return res.status(400).json({ error: 'SQL запрос не может быть пустым' });
  }
  
  //  SQL запрос
  connection.query(query, (err, results) => {
    if (err) {
      return res.json({ error: err.message });
    }
    
    // Если успех 
    res.json({ results });
  });
});






// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://5.187.3.57:${PORT}`);
});