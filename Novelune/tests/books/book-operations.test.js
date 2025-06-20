const { query } = require('../../server/config/database');
const Book = require('../../server/models/book');
const User = require('../../server/models/user');

describe('Basic Book Operations', () => {
  
  // Тест на создание книги
  test('should create and retrieve a book', async () => {
    try {
      // Создаем тестового пользователя
      const uniqueId = Date.now().toString();
      const username = `test_bookuser_${uniqueId}`;
      const email = `test_${uniqueId}@example.com`;
      
      console.log(`Создаем пользователя: ${username}`);
      
      // Используем параметризованный запрос для безопасности
      const userResult = await query(
        'INSERT INTO users (username, email, password, is_active) VALUES (?, ?, ?, ?)',
        [username, email, 'password123', 1]
      );
      
      const userId = Number(userResult.insertId);
      console.log(`Пользователь создан с ID: ${userId}`);
      
      // Проверяем, что пользователь создан
      const userCheck = await query('SELECT * FROM users WHERE id = ?', [userId]);
      console.log(`Найдено пользователей по ID ${userId}: ${userCheck.length}`);
      
      // Создаем книгу
      const bookTitle = `Тестовая книга ${uniqueId}`;
      
      console.log(`Создаем книгу: ${bookTitle}`);
      const bookResult = await query(
        'INSERT INTO books (title, description, author_id) VALUES (?, ?, ?)',
        [bookTitle, 'Описание тестовой книги', userId]
      );
      
      const bookId = Number(bookResult.insertId);
      console.log(`Книга создана с ID: ${bookId}`);
      
      // Даем время на запись данных
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Проверяем создание книги
      const bookCheck = await query('SELECT * FROM books WHERE id = ?', [bookId]);
      console.log(`Найдено книг по ID ${bookId}: ${bookCheck.length}`);
      
      expect(bookCheck.length).toBeGreaterThan(0);
      
      if (bookCheck.length > 0) {
        const book = bookCheck[0];
        expect(book.title).toBe(bookTitle);
        expect(Number(book.author_id)).toBe(userId);
      }
      
      // Очистка
      await query('DELETE FROM books WHERE id = ?', [bookId]);
      await query('DELETE FROM users WHERE id = ?', [userId]);
    } catch (error) {
      console.error('Ошибка в тесте создания книги:', error);
      throw error;
    }
  });
  
  // Тест на обновление книги
  test('should update a book title', async () => {
    try {
      // Создаём уникальное имя пользователя для этого теста
      const username = `bookuser2_${Math.floor(Math.random() * 10000)}`;
      const email = `${username}@example.com`;
      
      // Создаем тестового пользователя напрямую
      const userResult = await query(`
        INSERT INTO users (username, email, password, is_active) 
        VALUES (?, ?, ?, ?)
      `, [username, email, 'password123', 1]);
      
      const userId = Number(userResult.insertId);
      console.log(`Создан тестовый пользователь для обновления книги, ID: ${userId}`);
      
      // Создаем книгу для обновления
      const bookResult = await query(`
        INSERT INTO books (title, description, author_id) 
        VALUES (?, ?, ?)
      `, ['Книга для обновления', 'Будет обновлена', userId]);
      
      const bookId = Number(bookResult.insertId);
      console.log(`Создана книга для обновления, ID: ${bookId}`);
      
      // Обновляем заголовок книги
      const updateResult = await query('UPDATE books SET title = ? WHERE id = ?', 
        ['Обновленный заголовок', bookId]);
      
      // Получаем обновленную книгу
      const bookQuery = await query('SELECT * FROM books WHERE id = ?', [bookId]);
      expect(bookQuery.length).toBeGreaterThan(0);
      
      if (bookQuery.length > 0) {
        const book = bookQuery[0];
        
        // Проверка результата
        expect(book).toBeDefined();
        expect(book.title).toBe('Обновленный заголовок');
      }
      
      // Очищаем тестовые данные
      await query('DELETE FROM books WHERE id = ?', [bookId]);
      await query('DELETE FROM users WHERE username = ?', [username]);
    } catch (error) {
      console.error('Ошибка в тесте обновления книги:', error);
      throw error;
    }
  });
  
  // Тест для проверки методов модели
  test('should work with Book model methods', async () => {
    try {
      // Создаём уникальное имя пользователя для этого теста с временной меткой
      const uniqueId = Date.now().toString();
      const username = `bookmodel_${uniqueId}`;
      const email = `${username}@example.com`;
      
      // Создаем тестового пользователя
      console.log(`Создаем пользователя для теста модели: ${username}`);
      
      const userResult = await query(
        'INSERT INTO users (username, email, password, is_active) VALUES (?, ?, ?, ?)',
        [username, email, 'password123', 1]
      );
      
      const userId = Number(userResult.insertId);
      console.log(`Пользователь создан с ID: ${userId}`);
      
      // Проверяем, что пользователь создан
      const userCheck = await query('SELECT * FROM users WHERE id = ?', [userId]);
      console.log(`Найдено пользователей для модели: ${userCheck.length}`);
      
      // Создаем тестовую книгу
      console.log(`Создаем тестовую книгу для пользователя ${userId}`);
      const bookTitle = `Модельная книга ${uniqueId}`;
      
      const bookResult = await query(
        'INSERT INTO books (title, description, author_id) VALUES (?, ?, ?)',
        [bookTitle, 'Тестирование методов модели', userId]
      );
      
      const bookId = Number(bookResult.insertId);
      console.log(`Книга создана с ID: ${bookId}`);
      
      // Даем время базе данных на запись данных
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Получаем книгу через модель Book
      console.log(`Получаем книгу с ID ${bookId} через модель...`);
      const retrievedBook = await Book.getBookById(bookId);
      console.log('Результат:', retrievedBook ? 'книга найдена' : 'книга не найдена');
      
      // Если книга не найдена, проверяем, существует ли она
      if (!retrievedBook) {
        const directCheck = await query('SELECT * FROM books WHERE id = ?', [bookId]);
        console.log(`Прямая проверка книги ${bookId}: найдено ${directCheck.length}`);
        
        if (directCheck.length > 0) {
          console.log('Данные найденной книги:', directCheck[0]);
        }
      }
      
      // Проверяем, что книга найдена
      expect(retrievedBook).toBeDefined();
      expect(retrievedBook).not.toBeNull();
      
      if (retrievedBook) {
        expect(Number(retrievedBook.id)).toBe(bookId);
        
        // Обновляем книгу через модель
        const updateData = {
          title: `Обновлено ${uniqueId}`,
          description: 'Новое описание'
        };
        
        const updatedBook = await Book.updateBook(bookId, updateData);
        expect(updatedBook).toBeDefined();
        
        // Проверяем обновление
        const checkQuery = await query('SELECT * FROM books WHERE id = ?', [bookId]);
        expect(checkQuery.length).toBeGreaterThan(0);
        
        if (checkQuery.length > 0) {
          expect(checkQuery[0].title).toBe(updateData.title);
        }
      }
      
      // Очищаем тестовые данные
      await query('DELETE FROM books WHERE id = ?', [bookId]);
      await query('DELETE FROM users WHERE id = ?', [userId]);
    } catch (error) {
      console.error('Ошибка в тесте методов модели:', error);
      throw error;
    }
  });
});