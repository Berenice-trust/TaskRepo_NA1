const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Middleware для проверки авторизации
const auth = require('../middleware/auth');

// Редиректы со старых HTML-страниц на новые пути
router.get('/login.html', (req, res) => res.redirect('/login'));
router.get('/register.html', (req, res) => res.redirect('/register'));
router.get('/dashboard.html', (req, res) => res.redirect('/dashboard'));
router.get('/activate.html', (req, res) => {
  const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  res.redirect('/activate' + queryString);
});

// Главная страница
router.get('/', (req, res) => {
  res.render('pages/home', {
    title: 'Главная страница',
    metaDescription: 'Novelune - литературная платформа для публикации и чтения произведений',
    metaKeywords: 'книги, чтение, публикация, авторы'
  });
});

// Страница входа
router.get('/login', (req, res) => {
  res.render('pages/login', {
    title: 'Вход в систему',
    metaDescription: 'Вход в личный кабинет Novelune'
  });
});

// Страница регистрации
router.get('/register', (req, res) => {
  res.render('pages/register', {
    title: 'Регистрация',
    metaDescription: 'Регистрация нового автора на Novelune'
  });
});

// Тестовый маршрут для проверки шаблонизатора
router.get('/test', (req, res) => {
  res.render('pages/test', {
    title: 'Тест шаблонизатора',
    message: 'Handlebars успешно настроен!'
  });
});

// Страница личного кабинета
// router.get('/dashboard', auth, (req, res) => {
//   res.render('pages/dashboard', {
//     title: 'Личный кабинет',
//     user: req.user
//   });
// });
router.get('/dashboard', auth, async (req, res) => {
  const user = await User.findUserById(req.user.id); // Получаем пользователя из БД
  res.render('pages/dashboard', { user });
  });

// Страница активации
router.get('/activate', (req, res) => {
  res.render('pages/activate', {
    title: 'Активация аккаунта'
  });
});

module.exports = router;