// Модуль для работы с книгами
const { convertBigIntToNumber } = require('../utils/data-helpers');
const { query } = require('../config/database');

//Создание таблицы книг, если она не существует
async function createBooksTable() {
  const sql = `
     CREATE TABLE IF NOT EXISTS books (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      meta_title VARCHAR(100),
      meta_description VARCHAR(200),
      meta_keywords VARCHAR(200),
      cover_image VARCHAR(255),
      author_id INT NOT NULL,
      genre_id INT,
      subgenre_id INT,
      status ENUM('draft', 'in_progress', 'completed') DEFAULT 'draft',
      views INT DEFAULT 0,
      likes INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE SET NULL,
      FOREIGN KEY (subgenre_id) REFERENCES genres(id) ON DELETE SET NULL
    )
  `;
  return await query(sql);
}

 //Создание новой книги
async function createBook(bookData) {
  const { title, description, meta_title, meta_description, meta_keywords, cover_image, author_id, status = 'draft' } = bookData;
  
  const sql = `
    INSERT INTO books (title, description, meta_title, meta_description, meta_keywords, cover_image, author_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    const result = await query(sql, [
      title, 
      description, 
      meta_title, 
      meta_description, 
      meta_keywords, 
      cover_image, 
      author_id, 
      status
    ]);
    
   return { 
    id: Number(result.insertId), 
    ...bookData 
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Получение книги по ID
 * @param {number} id - ID книги
 * @returns {Promise<Object|null>} - Книга или null, если не найдена
 */
async function getBookById(id) {
  const sql = `
    SELECT b.*, u.username as author_name 
    FROM books b
    JOIN users u ON b.author_id = u.id
    WHERE b.id = ?
  `;
  
  const result = await query(sql, [id]);
 return result.length > 0 ? convertBigIntToNumber(result[0]) : null;

}

// Получение всех книг
async function getAllBooks(options = {}) {
  const { limit = 10, offset = 0, authorId = null, status = null } = options;
  
  let sql = `
    SELECT b.*, u.username as author_name 
    FROM books b
    JOIN users u ON b.author_id = u.id
  `;
  
  const params = [];
  
  // Добавляем условия фильтрации
  const conditions = [];
  
  if (authorId) {
    conditions.push('b.author_id = ?');
    params.push(authorId);
  }
  
  if (status) {
    conditions.push('b.status = ?');
    params.push(status);
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  // Добавляем сортировку и пагинацию
  sql += ` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
    return convertBigIntToNumber(await query(sql, params));
}

// Обновление книги
async function updateBook(id, bookData) {
  const { title, description, meta_title, meta_description, meta_keywords, cover_image, status } = bookData;
  
  // Строим динамический SQL-запрос на обновление только переданных полей
  let sql = 'UPDATE books SET ';
  const params = [];
  const updates = [];
  
  if (title !== undefined) {
    updates.push('title = ?');
    params.push(title);
  }
  
  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description);
  }
  
  if (meta_title !== undefined) {
    updates.push('meta_title = ?');
    params.push(meta_title);
  }
  
  if (meta_description !== undefined) {
    updates.push('meta_description = ?');
    params.push(meta_description);
  }
  
  if (meta_keywords !== undefined) {
    updates.push('meta_keywords = ?');
    params.push(meta_keywords);
  }
  
  if (cover_image !== undefined) {
    updates.push('cover_image = ?');
    params.push(cover_image);
  }
  
  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
  }
  
  // Если нечего обновлять, возвращаем ошибку
  if (updates.length === 0) {
    throw new Error('Нет данных для обновления');
  }
  
  sql += updates.join(', ');
  sql += ' WHERE id = ?';
  params.push(id);
  
  try {
    const result = await query(sql, params);
    
    if (result.affectedRows === 0) {
      throw new Error('Книга не найдена');
    }
    
  return { 
    id: Number(id),  // Преобразуем id в Number
    updated: true,
    ...bookData
    };
    } catch (error) {
        throw error;
    }
    }

// Удаление книги
async function deleteBook(id, authorId) {
  // Проверяем, что книга принадлежит этому автору (если не админ)
  if (authorId) {
    const book = await getBookById(id);
    if (!book || book.author_id !== authorId) {
      throw new Error('Нет прав для удаления этой книги');
    }
  }
  
  const sql = `DELETE FROM books WHERE id = ?`;
  
  try {
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

// Увеличение счетчика просмотров книги

async function incrementBookViews(id) {
  const sql = `UPDATE books SET views = views + 1 WHERE id = ?`;
  
  try {
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createBooksTable,
  createBook,
  getBookById,
  getAllBooks,
  updateBook,
  deleteBook,
  incrementBookViews
};