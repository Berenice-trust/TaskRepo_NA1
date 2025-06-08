const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { query } = require('./server/config/database');
const User = require('./server/models/user');

// Загружаем переменные окружения
dotenv.config();

// Проверка, что переменные окружения загружены
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);

const app = express();
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3007;

// Настраиваем middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'client')));

// Проверка подключения к базе
app.get('/api/test-db', async (req, res) => {
  try {
    // Простой запрос для проверки соединения
    const result = await query('SELECT 1 + 1 AS solution');
    
    // Попробуем создать таблицу пользователей
    await User.createUsersTable();
    
    res.json({ 
      success: true, 
      dbConnected: true,
      solution: result[0].solution,
      message: 'Подключение к базе данных работает'
    });
  } catch (error) {
    console.error('Ошибка при подключении к базе данных:', error);
    res.status(500).json({ 
      success: false, 
      dbConnected: false,
      error: error.message,
      message: 'Проблема с подключением к базе данных'
    });
  }
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Novelune сервер запущен: http://${HOST}:${PORT}`);
});