// файл для автоматической подготовки и очистки тестовой базы данных при запуске Jest-тестов.

const dotenv = require('dotenv');
const path = require('path');
const { query, closePool } = require('../server/config/database');

// Загружаем переменные окружения для тестов
process.env.NODE_ENV = 'test';
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Преобразование BigInt для корректной сериализации в тестах
BigInt.prototype.toJSON = function() { return Number(this); };

// Глобальная переменная для отслеживания закрытия пула
let poolClosed = false;

// Начало транзакции перед каждым тестом
beforeEach(async () => {
  await query('START TRANSACTION');
});

// Откат транзакции после каждого теста
afterEach(async () => {
  await query('ROLLBACK');
});

// После всех тестов - очищаем базу данных и закрываем соединение
afterAll(async () => {
  console.log('Очистка тестовой базы данных после тестов...');
  
  try {
    // Проверка, что используется тестовая БД
    if (!process.env.DB_NAME || !process.env.DB_NAME.includes('test')) {
      console.error('⚠️ Внимание: Не тестовая база данных! Очистка отменена');
      return;
    }
    
    // Отключаем проверку внешних ключей для очистки
    await query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Используем DELETE вместо TRUNCATE для совместимости с внешними ключами
    await query('DELETE FROM chapters WHERE 1=1');
    await query('DELETE FROM books WHERE 1=1');
    await query('DELETE FROM users WHERE 1=1');
    
    // Сбрасываем автоинкременты
    await query('ALTER TABLE chapters AUTO_INCREMENT = 1');
    await query('ALTER TABLE books AUTO_INCREMENT = 1');
    await query('ALTER TABLE users AUTO_INCREMENT = 1');
    
    // Включаем проверку внешних ключей
    await query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('База данных успешно очищена');
  } catch (err) {
    console.error('Ошибка при очистке базы данных:', err);
  } finally {
    // Закрываем соединение с БД
    try {
      if (!poolClosed) {
        poolClosed = true;
        await closePool();
      }
    } catch (err) {
      console.error('Ошибка при закрытии соединения:', err);
    }
  }
}, 15000); // Увеличиваем таймаут для надёжности