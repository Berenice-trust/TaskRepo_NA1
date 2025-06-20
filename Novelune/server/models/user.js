const { query } = require('../config/database');
const bcrypt = require('bcrypt');
const { validateUser } = require('../../shared/validation');
const crypto = require('crypto');
const { convertBigIntToNumber } = require('../utils/data-helpers');

// Хеширование пароля
async function hashPassword(password) {
  const saltRounds = 10; //означает 2^10 итераций алгоритма хеширования (1024 итерации)
  return await bcrypt.hash(password, saltRounds);
}

// Функция для генерации случайного токена
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Создание таблицы пользователей
async function createUsersTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('user', 'admin') DEFAULT 'user',
      is_active BOOLEAN DEFAULT FALSE, 
      verification_token VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  return await query(sql);
}

// Создание нового пользователя
async function createUser(userData) {
  const { username, email, password, role = 'user' } = userData;
  
   // Валидация данных (shared/validation.js)
  const validationErrors = validateUser(userData);
  if (validationErrors) {
    throw new Error(JSON.stringify(validationErrors));
  }

  // Хешируем пароль
  const hashedPassword = await hashPassword(password);

    // Генерируем токен для верификации email
  const verificationToken = generateToken();
  
  const sql = `
  INSERT INTO users (username, email, password, role, verification_token)
  VALUES (?, ?, ?, ?, ?)
`;
  
   try {
    const result = await query(sql, [username, email, hashedPassword, role, verificationToken]);
    return convertBigIntToNumber({ 
      id: result.insertId, 
      username, 
      email, 
      role,
      verificationToken
    });
  } catch (error) {
    // если пользователь уже существует
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Пользователь с таким именем или email уже существует');
    }
    throw error;
  }
}


// Поиск пользователя по имени пользователя
async function findUserByUsername(username) {
  const sql = `SELECT * FROM users WHERE username = ?`;
  const results = await query(sql, [username]);
  
 return results.length > 0 ? convertBigIntToNumber(results[0]) : null;

}

// Поиск пользователя по email
async function findUserByEmail(email) {
  const sql = `SELECT * FROM users WHERE email = ?`;
  const results = await query(sql, [email]);
  
   return results.length > 0 ? convertBigIntToNumber(results[0]) : null;
}

// Проверка пароля
async function validatePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

// Активация пользователя по токену верификации
async function activateUser(token) {
  const sql = `
    UPDATE users
    SET is_active = TRUE, verification_token = NULL
    WHERE verification_token = ?
  `;
  
  try {
    const result = await query(sql, [token]);
    
    if (result.affectedRows === 0) {
      throw new Error('Недействительный токен активации');
    }
    
    return true;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createUsersTable,
  hashPassword,
  createUser,
  findUserByUsername,
  findUserByEmail,
  validatePassword,
  activateUser,
  generateToken // для тестов
};