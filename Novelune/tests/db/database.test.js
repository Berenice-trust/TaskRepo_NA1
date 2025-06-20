const { query } = require('../../server/config/database');

// Загружаем переменные окружения для тестов
require('dotenv').config();

describe('Database Connection', () => {
  // Тест на подключение к базе данных
  test('should connect to the database successfully', async () => {
    try {
      // Выполняем простой запрос
      const result = await query('SELECT 1 + 1 AS solution');
      
      // Проверяем результат
      expect(result).toBeDefined();
      expect(result[0]).toHaveProperty('solution', 2);
    } catch (error) {
      // В случае ошибки тест падает
      fail(`Database connection failed: ${error.message}`);
    }
  });
  
  // Тест на существование таблицы users
  test('should have users table', async () => {
    try {
      // Проверяем существование таблицы
      const result = await query(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
      `, [process.env.DB_NAME]);
      
      // Проверяем результат
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    } catch (error) {
      fail(`Failed to check users table: ${error.message}`);
    }
  });
  
  // Тест на структуру таблицы users
  test('users table should have the correct structure', async () => {
    try {
      // Получаем информацию о столбцах таблицы users
      const columns = await query(`
        SELECT COLUMN_NAME 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
      `, [process.env.DB_NAME]);
      
      // Проверяем наличие всех необходимых столбцов
      const columnNames = columns.map(col => col.COLUMN_NAME);
      
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('username');
      expect(columnNames).toContain('email');
      expect(columnNames).toContain('password');
      expect(columnNames).toContain('role');
      expect(columnNames).toContain('created_at');
    } catch (error) {
      fail(`Failed to check users table structure: ${error.message}`);
    }
  });
  
  // Тест закрывает подключение к базе данных после выполнения всех тестов
  // afterAll(async () => {
  //   // Завершаем тесты, закрывая пул соединений
  //   // создали функцию closePool в database.js
  //   const { closePool } = require('../../server/config/database');
  //   await closePool();
  // });
});