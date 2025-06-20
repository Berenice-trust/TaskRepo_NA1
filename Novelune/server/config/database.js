const mariadb = require('mariadb');
const dotenv = require('dotenv');
const path = require('path');

// Переменная для отслеживания, было ли уже подключение
let connectionEstablished = false;

// Загружаем .env или .env.test в зависимости от окружения
if (process.env.NODE_ENV === 'test') {
  console.log('Загрузка тестовых настроек базы данных');
  dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });
  
  // Дополнительная проверка
  if (!process.env.DB_NAME.includes('test')) {
    console.error('⚠️ ОПАСНО: Тестовое окружение использует не тестовую базу данных!');
    process.exit(1); // Экстренное завершение работы
  }
} else {
  dotenv.config();
}

// Переменная для хранения пула
let pool;

// Функция для создания пула
function createPool() {
  pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    connectionLimit: 10
  });

  // Логируем подключение к определенной базе данных
  console.log(`Database connection pool created for: ${process.env.DB_NAME}`);

  // Если DEBUG, логируем все запросы
  if (process.env.DEBUG === 'true') {
    const originalQuery = pool.query;
    pool.query = function (...args) {
      console.log('Executing query:', args[0]);
      return originalQuery.apply(pool, args);
    };
  }

  // pool.on('connection', (connection) => {
  //   console.log('DB Connection established');
  // });
   pool.on('connection', (connection) => {
    if (!connectionEstablished) {
      console.log('DB Connection established');
      connectionEstablished = true;
    }
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // Не завершаем процесс при ошибке в пуле - это может мешать тестам
    // process.exit(-1);
  });
}

// Создаем пул при загрузке модуля
createPool();

// Тест подключения при запуске
(async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('Database connection successful');
    conn.release();
  } catch (err) {
    console.error('Failed to connect to database:', err);
  }
})();

// Функция для выполнения запросов к БД
async function query(sql, params) {
  let conn;
  try {
    // Проверяем, не закрыт ли пул
    if (!pool || pool._closed) {
      console.warn('Пытаемся использовать закрытый пул. Переподключаемся...');
      // Пересоздаем пул, если он закрыт
      createPool();
    }
    
    conn = await pool.getConnection();
    const result = await conn.query(sql, params);
    return result;
  } catch (err) {
    console.error('Ошибка запроса к БД:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// Закрытие пула соединений (для тестов и правильного завершения приложения)
async function closePool() {
  try {
    if (pool && !pool._closed) {
      await pool.end();
      console.log('Connection pool closed');
    }  else {
      console.log('Pool already closed or does not exist');
    }
  } catch (err) {
    console.error('Error closing connection pool', err);
  }
}

// Функция для получения текущего пула
function getPool() {
  return pool;
}

// Изменить экспорт на:
module.exports = { query, closePool, createPool, getPool };