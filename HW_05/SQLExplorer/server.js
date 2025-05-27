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

// Проверка подключения
connection.connect((err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err);
    return;
  }
  console.log('Подключение к MariaDB успешно!');
});





const app = express();
const PORT = 3004;

app.use(express.static('client'));
app.use(express.json()); //json в js объекты

// Тест
app.get('/test', (req, res) => {
  res.json({ message: 'Сервер работает!' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://5.187.3.57:${PORT}`);
});