const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');

// создаем сервер
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3003;

// Middleware для JSON и URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// для статических файлов
app.use(express.static(path.join(__dirname, 'client')));

// Тест
app.get('/api/test', (req, res) => {
  res.json({ message: 'API сервер работает!' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://5.187.3.57:${PORT}`);
});