@ -0,0 +1,52 @@
const { query } = require('../../server/config/database');

describe('Books Table Structure', () => {
  // Тест на существование таблицы books
  test('should have books table', async () => {
    try {
      // Проверяем существование таблицы
      const result = await query(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'books'
      `, [process.env.DB_NAME]);
      
      // Проверяем результат
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    } catch (error) {
      fail(`Failed to check books table: ${error.message}`);
    }
  });
  
  // Тест на структуру таблицы books
  test('books table should have the correct structure', async () => {
    try {
      // Получаем информацию о столбцах таблицы books
      const columns = await query(`
        SELECT COLUMN_NAME 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'books'
      `, [process.env.DB_NAME]);
      
      // Проверяем наличие всех необходимых столбцов
      const columnNames = columns.map(col => col.COLUMN_NAME);
      
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('title');
      expect(columnNames).toContain('description');
      expect(columnNames).toContain('meta_title');
      expect(columnNames).toContain('meta_description');
      expect(columnNames).toContain('meta_keywords');
      expect(columnNames).toContain('cover_image');
      expect(columnNames).toContain('author_id');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('views');
      expect(columnNames).toContain('likes');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    } catch (error) {
      fail(`Failed to check books table structure: ${error.message}`);
    }
  });
});