const Book = require('../../server/models/book');
const Chapter = require('../../server/models/chapter');
const User = require('../../server/models/user');
const { query } = require('../../server/config/database');

describe('Chapter Model Operations', () => {
  test('should create and get chapter', async () => {
    // Создаём пользователя
    const user = await User.createUser({
      username: 'chaptertestuser',
      email: 'chaptertestuser@example.com',
      password: 'password123'
    });
    
    // Создаём книгу
    const book = await Book.createBook({
      title: 'Книга для главы',
      description: 'Тестовая книга',
      author_id: user.id
    });
    
    // Проверяем создание главы через SQL напрямую
    const chapterResult = await query(`
      INSERT INTO chapters (book_id, title, content, chapter_number, status)
      VALUES (?, ?, ?, ?, ?)
    `, [book.id, 'Тестовая глава', 'Текст главы', 1, 'draft']);
    
    const chapterId = chapterResult.insertId;
    
    // Получаем главу напрямую через SQL
    const chapterData = await query('SELECT * FROM chapters WHERE id = ?', [chapterId]);
    expect(chapterData.length).toBe(1);
    expect(chapterData[0].title).toBe('Тестовая глава');
    
    // Очистка данных
    await query('DELETE FROM chapters WHERE id = ?', [chapterId]);
    await Book.deleteBook(book.id);
    await query('DELETE FROM users WHERE id = ?', [user.id]);
  });
});