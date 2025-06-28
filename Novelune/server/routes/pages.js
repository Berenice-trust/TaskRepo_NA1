const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Genre = require('../models/genre'); 
const Book = require('../models/book');
const Chapter = require('../models/chapter');
const multer = require('multer');
// const upload = multer({ dest: 'uploads/' });
const upload = multer({ dest: 'client/uploads/covers/' }); 
const imageUpload = multer({ dest: 'client/uploads/images/' });
const path = require('path');
const fs = require('fs');
const optionalAuth = require('../middleware/optionalAuth');


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
router.get('/', optionalAuth, async (req, res) => {
  let user = null;
  if (req.user) {
    user = await User.findUserById(req.user.id);
  }
  res.render('pages/home', {
    title: 'Главная страница',
    metaDescription: 'Novelune - литературная платформа для публикации и чтения произведений',
    metaKeywords: 'книги, чтение, публикация, авторы',
    user
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
  const user = await User.findUserById(req.user.id);
  // Получаем книги автора, сортировка по дате создания (новые сверху)
  const books = await Book.getAllBooks({ authorId: req.user.id, limit: 100, offset: 0 });
  res.render('pages/dashboard', { user, books });
});

// Страница активации
router.get('/activate', (req, res) => {
  res.render('pages/activate', {
    title: 'Активация аккаунта'
  });
});

// Форма создания книги
router.get('/books/new', auth, async (req, res) => {
  const genres = await Genre.getAllGenres();
   const user = await User.findUserById(req.user.id); 
  //console.log('genres:', genres); // Проверяем, что в genres  
  res.render('pages/book-new', {
    title: 'Создать книгу',
    genres,
    genresJson: JSON.stringify(genres || []),
    user
  });
});

// Обработка создания книги
router.post('/books/new', auth, upload.single('cover_image'), async (req, res) => {
  try {
    const { title, genre_id, subgenre_id, description, status } = req.body;
    const cover_image = req.file ? req.file.filename : null;
    const author_id = req.user.id; 

     // Получаем id новой книги
const newBook = await Book.createBook({
  title,
  genre_id: genre_id || null,
  subgenre_id: subgenre_id || null,
  description,
  status,
  cover_image,
  author_id
});

    res.redirect(`/books/${newBook.id}`); 
  } catch (err) {
    console.error(err);
    res.render('pages/book-new', {
      title: 'Создать книгу',
      error: 'Ошибка при создании книги. Попробуйте ещё раз.'
    });
  }
});

router.post('/books/:id/delete', auth, async (req, res) => {
  try {
    await Book.deleteBook(req.params.id, req.user.id);
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
});

router.get('/books/:bookId/chapters/new', auth, async (req, res) => {
  const { bookId } = req.params;
  const user = await User.findUserById(req.user.id); // добавь эту строку
  res.render('pages/chapter-new', {
    title: 'Добавить главу',
    bookId,
    user 
  });
});

router.get('/books/:id', auth, async (req, res) => {
  const book = await Book.getBookById(req.params.id);
 const chapters = await Chapter.getBookChapters(req.params.id);
 const user = await User.findUserById(req.user.id);
   const genres = await Genre.getAllGenres(); 
  res.render('pages/book-detail', {
    title: book.title,
    book,
    chapters,
    user,
    genres,
    genresJson: JSON.stringify(genres || [])
  });
});

router.post('/books/:bookId/chapters/new', auth, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, chapter_number, content } = req.body;

      // Сдвигаем все главы с таким или большим номером на +1
    await Chapter.shiftChapterNumbers(bookId, chapter_number);

    // Добавляем новую главу
    await Chapter.createChapter({
      book_id: bookId,
      title,
      chapter_number,
      content,
      status: 'draft'
    });
    // После добавления главы редиректим на страницу книги
    res.redirect(`/books/${bookId}`);
  } catch (err) {
    console.error(err);
    res.render('pages/chapter-new', {
      title: 'Добавить главу',
      bookId,
      error: 'Ошибка при добавлении главы. Попробуйте ещё раз.'
    });
  }
});

router.post('/books/:bookId/chapters/:chapterId/delete', auth, async (req, res) => {
  try {
    await Chapter.deleteChapter(req.params.chapterId);
    res.redirect(`/books/${req.params.bookId}`);
  } catch (err) {
    console.error(err);
    res.redirect(`/books/${req.params.bookId}`);
  }
});

// Страница редактирования главы
router.get('/books/:bookId/chapters/:chapterId/edit', auth, async (req, res) => {
  const { bookId, chapterId } = req.params;
  const user = await User.findUserById(req.user.id);
  const chapter = await Chapter.getChapterById(chapterId);
  if (!chapter) {
    return res.status(404).render('pages/404', { title: 'Глава не найдена', user });
  }
  res.render('pages/chapter-edit', {
    title: 'Редактировать главу',
    bookId,
    chapter,
    user
  });
});

// Обработка редактирования главы
router.post('/books/:bookId/chapters/:chapterId/edit', auth, async (req, res) => {
  const { bookId, chapterId } = req.params;
  const { title, chapter_number, content } = req.body;
  try {
    const chapter = await Chapter.getChapterById(chapterId);
    const oldNumber = chapter.chapter_number;
    const newNumber = Number(chapter_number);

    if (newNumber !== oldNumber) {
      if (newNumber > oldNumber) {
        // Сдвигаем главы между oldNumber+1 и newNumber на -1
        await Chapter.shiftChapterNumbersDown(bookId, oldNumber, newNumber);
      } else {
        // Сдвигаем главы между newNumber и oldNumber-1 на +1
        await Chapter.shiftChapterNumbersUp(bookId, newNumber, oldNumber);
      }
    }

    await Chapter.updateChapter(chapterId, { title, chapter_number: newNumber, content });
    res.redirect(`/books/${bookId}`);
  } catch (err) {
    // ...
  }
});

router.post('/api/images/upload', auth, imageUpload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Нет файла' });
  }
  // Вернём путь для вставки в редактор
  const imageUrl = `/uploads/images/${req.file.filename}`;
  res.json({ location: imageUrl });
});

// GET /books/:id/edit — страница редактирования
// router.get('/books/:id/edit', auth, async (req, res) => {
//   const book = await Book.getBookById(req.params.id);
//   const genres = await Genre.getAllGenres();
//   const user = await User.findUserById(req.user.id);
//   if (!book) {
//     return res.status(404).render('pages/404', { title: 'Книга не найдена', user });
//   }
//   res.render('pages/book-edit', {
//     title: 'Редактировать книгу',
//     book,
//     genres,
//     user
//   });
// });

// POST /books/:id/edit — обработка формы
router.post('/books/:id/edit', auth, async (req, res) => {
  try {
    const { title, genre_id, subgenre_id, description, status } = req.body;
   await Book.updateBook(req.params.id, {
  title,
  genre_id: genre_id ? Number(genre_id) : null,
  subgenre_id: subgenre_id ? Number(subgenre_id) : null,
  description,
  status
});
    res.redirect(`/books/${req.params.id}`);
  } catch (err) {
    console.error(err);
    // Можно добавить повторный рендер с ошибкой
    res.redirect(`/books/${req.params.id}`);
  }
});

module.exports = router;