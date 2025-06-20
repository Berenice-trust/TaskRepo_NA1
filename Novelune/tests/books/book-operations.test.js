const { query } = require('../../server/config/database');
const Book = require('../../server/models/book');
const User = require('../../server/models/user');

describe('Basic Book Operations', () => {
  // Изменим подход - каждый тест будет создавать своего пользователя и книгу
  
  // Тест на создание книги
  test('should create and retrieve a book', async () => {
    // Создаем тестового пользователя напрямую через SQL
    const userResult = await query(`
      INSERT INTO users (username, email, password, is_active) 
      VALUES (?, ?, ?, ?)
    `, ['bookuser1', 'bookuser1@example.com', 'password123', 1]);
    
    const userId = Number(userResult.insertId);
    
    // Вставляем книгу напрямую через SQL
    const bookResult = await query(`
      INSERT INTO books (title, description, author_id) 
      VALUES (?, ?, ?)
    `, ['Тестовая книга', 'Описание тестовой книги', userId]);
    
    // Сохраняем ID книги
    const testBookId = Number(bookResult.insertId);
    
    // Получаем книгу через SQL
    const bookQuery = await query('SELECT * FROM books WHERE id = ?', [testBookId]);
    const book = bookQuery[0];
    
    // Проверка результата
    expect(book).toBeDefined();
    expect(Number(book.id)).toBe(testBookId);
    expect(book.title).toBe('Тестовая книга');
    expect(Number(book.author_id)).toBe(userId);
    
    // Очищаем тестовые данные
    await query('DELETE FROM books WHERE id = ?', [testBookId]);
    await query('DELETE FROM users WHERE id = ?', [userId]);
  });
  
  // Тест на обновление книги
  test('should update a book title', async () => {
    // Создаем тестового пользователя напрямую
    const userResult = await query(`
      INSERT INTO users (username, email, password, is_active) 
      VALUES (?, ?, ?, ?)
    `, ['bookuser2', 'bookuser2@example.com', 'password123', 1]);
    
    const userId = Number(userResult.insertId);
    
    // Создаем книгу для обновления
    const bookResult = await query(`
      INSERT INTO books (title, description, author_id) 
      VALUES (?, ?, ?)
    `, ['Книга для обновления', 'Будет обновлена', userId]);
    
    const bookId = Number(bookResult.insertId);
    
    // Проверим, что книга существует
    const checkQuery = await query('SELECT * FROM books WHERE id = ?', [bookId]);
    console.log('Найдено книг перед обновлением:', checkQuery.length);
    
    // Обновляем заголовок книги
    const updateResult = await query('UPDATE books SET title = ? WHERE id = ?', 
      ['Обновленный заголовок', bookId]);
    console.log('Обновлено строк:', updateResult.affectedRows);
    
    // Получаем обновленную книгу
    const bookQuery = await query('SELECT * FROM books WHERE id = ?', [bookId]);
    const book = bookQuery[0];
    
    // Проверка результата
    expect(bookQuery.length).toBeGreaterThan(0);
    expect(book).toBeDefined();
    expect(book.title).toBe('Обновленный заголовок');
    
    // Очищаем тестовые данные
    await query('DELETE FROM books WHERE id = ?', [bookId]);
    await query('DELETE FROM users WHERE id = ?', [userId]);
  });
  
  // Тест для проверки методов модели
  test('should work with Book model methods', async () => {
    // Создаем тестового пользователя через модель User
    const testUser = await User.createUser({
      username: 'bookuser3',
      email: 'bookuser3@example.com',
      password: 'password123'
    });
    
    // 1. Создание книги через модель
    const bookData = {
      title: 'Книга через модель',
      description: 'Создана через Book.createBook()',
      author_id: testUser.id // Используем ID созданного пользователя
    };
    
    const createdBook = await Book.createBook(bookData);
    
    // Проверяем результат создания
    expect(createdBook).toBeDefined();
    expect(typeof createdBook.id).toBe('number');
    expect(createdBook.title).toBe(bookData.title);
    
    const bookId = createdBook.id;
    
    // 2. Получение книги через модель
    const retrievedBook = await Book.getBookById(bookId);
    
    expect(retrievedBook).toBeDefined();
    expect(retrievedBook.id).toBe(bookId);
    expect(retrievedBook.title).toBe(bookData.title);
    
    // 3. Обновление книги через модель
    const updatedData = {
      title: 'Обновлено через модель',
      description: 'Обновлено через Book.updateBook()'
    };
    
    await Book.updateBook(bookId, updatedData);
    
    // Проверяем обновление
    const updatedBook = await Book.getBookById(bookId);
    expect(updatedBook.title).toBe(updatedData.title);
    expect(updatedBook.description).toBe(updatedData.description);
    
   // 4. Удаление книги через модель
// Сначала проверим, что книга существует
const bookExists = await Book.getBookById(bookId);
expect(bookExists).not.toBeNull();

// Затем удалим ее
await Book.deleteBook(bookId);

// И проверим, что она удалена
const afterDeleteCheck = await Book.getBookById(bookId);
expect(afterDeleteCheck).toBeNull();
    
    // Очищаем тестового пользователя
    await query('DELETE FROM users WHERE id = ?', [testUser.id]);
  });
});