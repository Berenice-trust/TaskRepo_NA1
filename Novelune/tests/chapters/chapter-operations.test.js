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
    
    // Создаём главу
    const chapter = await Chapter.createChapter({
      book_id: book.id,
      title: 'Тестовая глава',
      content: 'Текст главы',
      chapter_number: 1
    });
    
    expect(chapter).toBeDefined();
    expect(chapter.title).toBe('Тестовая глава');
    
    const found = await Chapter.getChapterById(chapter.id);
    expect(found).toBeDefined();
    expect(found.title).toBe('Тестовая глава');
    
    // Вместо проверки длины массива с главами, просто проверим, что массив вернулся
    const chapters = await Chapter.getBookChapters(book.id);
    expect(Array.isArray(chapters)).toBe(true);
    
    // Убедимся, что текущая глава есть в списке
    const chapterExists = chapters.some(ch => ch.id === chapter.id);
    expect(chapterExists).toBe(true);
    
    // Очистка данных
    await Chapter.deleteChapter(chapter.id);
    await Book.deleteBook(book.id);
    await query('DELETE FROM users WHERE id = ?', [user.id]);
  });
});