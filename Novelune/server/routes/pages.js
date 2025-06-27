const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Genre = require('../models/genre'); 
const Book = require('../models/book');
const multer = require('multer');
// const upload = multer({ dest: 'uploads/' });
const upload = multer({ dest: 'client/uploads/covers/' }); 

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

// Форма создания книги
router.get('/books/new', async (req, res) => {
  const genres = await Genre.getAllGenres();
  console.log('genres:', genres); // Проверяем, что в genres  
  res.render('pages/book-new', {
    title: 'Создать книгу',
    genres,
    genresJson: JSON.stringify(genres || []) 
  });
});

// Обработка создания книги
router.post('/books/new', auth, upload.single('cover_image'), async (req, res) => {
  try {
    const { title, genre_id, subgenre_id, description, status } = req.body;
    const cover_image = req.file ? req.file.filename : null;
    const author_id = req.user.id; 

    await Book.createBook({
      title,
      genre_id: genre_id || null,
      subgenre_id: subgenre_id || null,
      description,
      status,
      cover_image,
      author_id
    });

    res.redirect('/dashboard'); // или на страницу книги
  } catch (err) {
    console.error(err);
    res.render('pages/book-new', {
      title: 'Создать книгу',
      error: 'Ошибка при создании книги. Попробуйте ещё раз.'
    });
  }
});

module.exports = router;