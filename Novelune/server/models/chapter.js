const { query } = require('../config/database');
const { convertBigIntToNumber } = require('../utils/data-helpers');


/**
 * Создание таблицы глав книг
 * @returns {Promise} - Результат выполнения запроса
 */
async function createChaptersTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS chapters (
      id INT AUTO_INCREMENT PRIMARY KEY,
      book_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      chapter_number INT NOT NULL,
      status ENUM('draft', 'published') DEFAULT 'draft',
      views INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `;
  return await query(sql);
}

/**
 * Создание новой главы
 * @param {Object} chapterData - Данные о главе
 * @returns {Promise<Object>} - Созданная глава
 */
async function createChapter(chapterData) {
  const { book_id, title, content, chapter_number, status = 'draft' } = chapterData;
  
  const sql = `
    INSERT INTO chapters (book_id, title, content, chapter_number, status)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  try {
    const result = await query(sql, [book_id, title, content, chapter_number, status]);
    
     return { 
      id: Number(result.insertId), 
      ...chapterData 
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Получение главы по ID
 * @param {number} id - ID главы
 * @returns {Promise<Object|null>} - Глава или null, если не найдена
 */
async function getChapterById(id) {
  const sql = `
    SELECT c.*, b.title as book_title 
    FROM chapters c
    JOIN books b ON c.book_id = b.id
    WHERE c.id = ?
  `;
  
  const result = await query(sql, [id]);
  return result.length > 0 ? convertBigIntToNumber(result[0]) : null;
}

/**
 * Получение всех глав книги
 * @param {number} bookId - ID книги
 * @param {Object} options - Опции запроса
 * @returns {Promise<Array>} - Массив глав
 */
async function getBookChapters(bookId, options = {}) {
  const { onlyPublished = false } = options;
  
  let sql = `
    SELECT * FROM chapters 
    WHERE book_id = ?
  `;
  
  if (onlyPublished) {
    sql += ` AND status = 'published'`;
  }
  
  sql += ` ORDER BY chapter_number ASC`;
  
   return convertBigIntToNumber(await query(sql, [bookId]));
}

/**
 * Обновление главы
 * @param {number} id - ID главы
 * @param {Object} chapterData - Новые данные главы
 * @returns {Promise<Object>} - Результат обновления
 */
async function updateChapter(id, chapterData) {
  const { title, content, chapter_number, status } = chapterData;
  
  // Строим динамический SQL-запрос на обновление только переданных полей
  let sql = 'UPDATE chapters SET ';
  const params = [];
  const updates = [];
  
  if (title !== undefined) {
    updates.push('title = ?');
    params.push(title);
  }
  
  if (content !== undefined) {
    updates.push('content = ?');
    params.push(content);
  }
  
  if (chapter_number !== undefined) {
    updates.push('chapter_number = ?');
    params.push(chapter_number);
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
      throw new Error('Глава не найдена');
    }
    
    return { 
      id: parseInt(id),
      updated: true,
      ...chapterData
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Удаление главы
 * @param {number} id - ID главы
 * @returns {Promise<boolean>} - Результат удаления
 */
async function deleteChapter(id) {
  const sql = `DELETE FROM chapters WHERE id = ?`;
  
  try {
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Увеличение счетчика просмотров главы
 * @param {number} id - ID главы
 * @returns {Promise<boolean>} - Результат обновления
 */
async function incrementChapterViews(id) {
  const sql = `UPDATE chapters SET views = views + 1 WHERE id = ?`;
  
  try {
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createChaptersTable,
  createChapter,
  getChapterById,
  getBookChapters,
  updateChapter,
  deleteChapter,
  incrementChapterViews
};