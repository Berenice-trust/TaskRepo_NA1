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
const { saveImage } = require('../services/image.service');
const optionalAuth = require('../middleware/optionalAuth');
const Image = require('../models/image');
const fs = require('fs');


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
    let cover_image = null;

    let newBook = null;

    if (req.file) {
      const buffer = fs.readFileSync(req.file.path); // если используешь multer с dest, иначе req.file.buffer
      const ext = path.extname(req.file.originalname).toLowerCase();
      const filename = `cover_${Date.now()}${ext}`;
      const destFolder = path.join(__dirname, '../../client/uploads/covers');
      await saveImage({ buffer, destFolder, filename, resize: { width: 400, height: 600 }, quality: 80 });

      // Записываем в images
      // newBook.id будет известен только после создания книги, поэтому пока пропусти book_id
      cover_image = filename;
    }

    // Создаём книгу
    newBook = await Book.createBook({
      title,
      genre_id: genre_id || null,
      subgenre_id: subgenre_id || null,
      description,
      status,
      cover_image,
      author_id: req.user.id
    });

    // Теперь можно добавить запись в images с book_id
    if (req.file && cover_image) {
      await Image.create({
        file_path: `/uploads/covers/${cover_image}`,
        original_name: req.file.originalname,
        book_id: newBook.id
      });
      // Удаляем временный файл, если multer сохраняет его
      fs.unlinkSync(req.file.path);
    }

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

async function getNextChapterId() {
  const result = await Chapter.getMaxChapterId();
  return result ? result + 1 : 1;
}

router.get('/books/:bookId/chapters/new', auth, async (req, res) => {
  try {
    const { bookId } = req.params;
    const user = await User.findUserById(req.user.id);
    const nextChapterId = await getNextChapterId();
    res.render('pages/chapter-new', {
      title: 'Добавить главу',
      bookId,
      user,
      nextChapterId
    });
  } catch (err) {
    // TODO: обработка ошибок
    console.error(err);
  }
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
    const newChapter = await Chapter.createChapter({
      book_id: bookId,
      title,
      chapter_number,
      content,
      status: 'draft'
    });

     // Привязываем все картинки без chapter_id, которые есть в тексте главы
    const imgSrcs = [];
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    let match;
    while ((match = imgRegex.exec(content))) {
      imgSrcs.push(match[1]);
    }
    for (const src of imgSrcs) {
      await Image.updateChapterIdByPath(src, newChapter.id, bookId);
    }

     // После добавления главы редиректим на страницу книги
    res.redirect(`/books/${bookId}`);




  
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка при сохранении главы');
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


    const imgSrcs = [];
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    let match;
    while ((match = imgRegex.exec(content))) {
      imgSrcs.push(match[1]);
    }
    for (const src of imgSrcs) {
      await Image.updateChapterIdByPath(src, chapterId, bookId);
    }


    res.redirect(`/books/${bookId}`);
  } catch (err) {
    // TODO
  }
});

router.post('/api/images/upload', auth, imageUpload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Нет файла' });
  }

  try {
    // Добавляем оригинальное расширение к имени файла
    const ext = path.extname(req.file.originalname).toLowerCase();
    const newFilename = req.file.filename + ext;
    const oldPath = path.join(__dirname, '../../client/uploads/images/', req.file.filename);
    const newPath = path.join(__dirname, '../../client/uploads/images/', newFilename);
    
    // Переименовываем файл с добавлением расширения
    fs.renameSync(oldPath, newPath);
    
    // Путь к изображению для сохранения в БД и возврата в TinyMCE
    const imageUrl = `/uploads/images/${newFilename}`;
    
    // Записываем в базу
    await Image.create({
      file_path: imageUrl,
      original_name: req.file.originalname,
      book_id: req.body.book_id || null,
      chapter_id: req.body.chapter_id || null,
      user_id: req.user.id
    });

    console.log('Изображение сохранено с расширением:', {
      path: imageUrl,
      chapter_id: req.body.chapter_id || null,
      book_id: req.body.book_id || null,
      user_id: req.user.id
    });
    
    res.json({ location: imageUrl });
  } catch (err) {
    console.error('Ошибка при сохранении изображения:', err);
    res.status(500).json({ error: 'Ошибка при сохранении изображения' });
  }
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
router.post('/books/:id/edit', auth, upload.single('cover_image'), async (req, res) => {
  try {
    const { title, genre_id, subgenre_id, description, status } = req.body;
    let cover_image = null;

    // Если загружена новая обложка
    if (req.file) {
      // Удаляем старую обложку (и файл, и запись в images)
      const oldImages = await Image.getByBook(req.params.id);
      for (const img of oldImages) {
        await deleteImage(path.join(__dirname, '../../client', img.file_path));
        await Image.deleteById(img.id); // если хочешь удалять запись из images
      }

      //  Сохраняем новую обложку
      const buffer = fs.readFileSync(req.file.path);
      const ext = path.extname(req.file.originalname).toLowerCase();
      const filename = `cover_${Date.now()}${ext}`;
      const destFolder = path.join(__dirname, '../../client/uploads/covers');
      await saveImage({ buffer, destFolder, filename, resize: { width: 400, height: 600 }, quality: 80 });
      cover_image = filename;

      // Записываем новую обложку в images
      await Image.create({
        file_path: `/uploads/covers/${cover_image}`,
        original_name: req.file.originalname,
        book_id: req.params.id
      });

      // Удаляем временный файл, если multer сохраняет его
      fs.unlinkSync(req.file.path);
    }

    // Обновляем книгу
    await Book.updateBook(req.params.id, {
      title,
      genre_id: genre_id ? Number(genre_id) : null,
      subgenre_id: subgenre_id ? Number(subgenre_id) : null,
      description,
      status,
      ...(cover_image ? { cover_image } : {}) // только если есть новая обложка
    });

    res.redirect(`/books/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.redirect(`/books/${req.params.id}`);
  }
});

// Замена обложки книги
router.post('/books/:id/cover', auth, upload.single('cover_image'), async (req, res) => {
  try {
    const bookId = req.params.id;
    if (!req.file) {
      return res.redirect(`/books/${bookId}`);
    }

    // Удаляем старую обложку (и файл, и запись в images)
    const book = await Book.getBookById(bookId);
    if (book && book.cover_image) {
      const oldPath = path.join(__dirname, '../../client/uploads/covers/', book.cover_image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      // Можно также удалить запись из images, если нужно
    }

    // Сохраняем новую обложку
    const buffer = fs.readFileSync(req.file.path);
    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = `cover_${Date.now()}${ext}`;
    const destFolder = path.join(__dirname, '../../client/uploads/covers');
    await saveImage({ buffer, destFolder, filename, resize: { width: 400, height: 600 }, quality: 80 });

    // Обновляем книгу
    await Book.updateBook(bookId, { cover_image: filename });

    // Удаляем временный файл
    fs.unlinkSync(req.file.path);

    res.redirect(`/books/${bookId}`);
  } catch (err) {
    console.error('Ошибка при замене обложки:', err);
    res.redirect(`/books/${req.params.id}`);
  }
});

router.get('/books', optionalAuth, async (req, res) => {
  const { genre_id, subgenre_id, author, q, sort = 'date_desc' } = req.query;
  const genres = await Genre.getAllGenres();
  const books = await Book.getAllBooksFiltered({ genre_id, subgenre_id, author, q, sort });

   let user = null;
  if (req.user) {
    user = await User.findUserById(req.user.id);
  }

  res.render('pages/books-list', {
    title: 'Все книги',
    books,
    genres,
    filters: { genre_id, subgenre_id, author, q, sort },
    user
  });
});

router.get('/books/:id/view', optionalAuth, async (req, res) => {
  const book = await Book.getBookById(req.params.id);
  if (!book) {
    return res.status(404).render('pages/404', { title: 'Книга не найдена' });
  }
  const chapters = await Chapter.getBookChapters(req.params.id);

  let user = null;
  if (req.user) {
    user = await User.findUserById(req.user.id);
  }

  res.render('pages/book-detail-public', {
    title: book.title,
    book,
    chapters,
    user
  });
});


router.get('/books/:bookId/chapters/:chapterId/read', optionalAuth, async (req, res) => {
  const { bookId, chapterId } = req.params;
  const book = await Book.getBookById(bookId);
  const chapter = await Chapter.getChapterById(chapterId);
  if (!book || !chapter) {
    return res.status(404).render('pages/404', { title: 'Глава не найдена' });
  }

  let user = null;
  if (req.user) {
    user = await User.findUserById(req.user.id);
  }

  res.render('pages/chapter-read', {
    title: `${book.title} — Глава ${chapter.chapter_number}`,
    book,
    chapter,
    user
  });
});



module.exports = router;