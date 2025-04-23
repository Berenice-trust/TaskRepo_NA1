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
app.use('/shared', express.static(path.join(__dirname, 'shared')));

// Тест
app.get('/api/test', (req, res) => {
  res.json({ message: 'API сервер работает!' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://5.187.3.57:${PORT}`);
});




// В начало файла добавить:
// const { validateUrl } = require('./shared/validators');

// Пример использования в обработчике:
// app.post('/api/send-request', (req, res) => {
//   const { url } = req.body;
  
//   // Валидация URL на сервере
  // const validation = validateUrl(url);
  // if (!validation.valid) {
  //   return res.status(400).json({ error: validation.message });
  // }
  
  // Если URL валиден, продолжаем обработку
  // ...дальнейший код...
// });