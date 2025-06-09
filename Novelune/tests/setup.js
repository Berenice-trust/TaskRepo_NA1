const dotenv = require('dotenv');
const path = require('path');
const User = require('../server/models/user');
const { query, closePool } = require('../server/config/database'); // Добавить импорт closePool

// Загружаем переменные окружения из .env.test, если мы в тестовом режиме
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.test') });
  console.log('Используем тестовую базу данных:', process.env.DB_NAME);
}

// Глобальная переменная для отслеживания, был ли закрыт пул
let poolClosed = false;

// Выполняется перед всеми тестами
beforeAll(async () => {
  // Инициализация тестовой базы данных
  if (process.env.NODE_ENV === 'test') {
    console.log('Инициализация тестовой базы данных...');
    
    // Создаем все необходимые таблицы
    await User.createUsersTable();
  }
});

// Выполняется после всех тестов
afterAll(async () => {
  if (process.env.NODE_ENV === 'test') {
     // Проверка, что мы действительно используем тестовую базу
    if (!process.env.DB_NAME || !process.env.DB_NAME.includes('test')) {
      console.error('⚠️ ВНИМАНИЕ: НЕ ТЕСТОВАЯ БАЗА ДАННЫХ! Очистка отменена');
      return;
    }
    
    console.log('Очистка тестовой базы данных после тестов...');
    
    try {
      // Удаляем всех пользователей
      await query('DELETE FROM users WHERE 1=1');
      // Сбрасываем автоинкремент
      await query('ALTER TABLE users AUTO_INCREMENT = 1');
      console.log('База данных успешно очищена');
    } catch (err) {
      console.error('Ошибка при очистке базы данных:', err);
    }
    
    // Закрываем соединение с базой данных в самом конце
    try {
      if (!poolClosed) {
        poolClosed = true;
        await closePool();
      }
    } catch (closeErr) {
      console.error('Ошибка при закрытии пула:', closeErr);
    }
  }
}, 10000); // Увеличиваем таймаут для afterAll