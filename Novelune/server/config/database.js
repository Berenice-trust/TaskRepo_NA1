const mariadb = require('mariadb');
const dotenv = require('dotenv');

dotenv.config();

// Создание пула подключений к базе данных
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5
});

pool.on('connection', (connection) => {
  console.log('DB Connection established');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

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
    if (pool) {
      await pool.end();
      console.log('Connection pool closed');
    }
  } catch (err) {
    console.error('Error closing connection pool', err);
  }
}

// экспорт
module.exports = { query, closePool };