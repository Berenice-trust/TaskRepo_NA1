// Модуль для работы с книгами
const { convertBigIntToNumber } = require('../utils/data-helpers');
const { query } = require('../config/database');
const Image = require('./image');
const { deleteImage } = require('../services/image.service');
const path = require('path');
const Chapter = require('./chapter');

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
 const { title, description, meta_title, meta_description, meta_keywords, cover_image, author_id, status = 'draft', genre_id, subgenre_id } = bookData;
 
  const sql = `
    INSERT INTO books (title, description, meta_title, meta_description, meta_keywords, cover_image, author_id, status, genre_id, subgenre_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      status,
      genre_id || null,
      subgenre_id || null
    ]);
    
   return { 
    id: Number(result.insertId), 
    ...bookData 
    };
  } catch (error) {
    throw error;
  }
}


async function getBookById(id) {
   const sql = `
    SELECT b.*, 
           g.name AS genre_name, 
           sg.name AS subgenre_name
    FROM books b
    LEFT JOIN genres g ON b.genre_id = g.id
    LEFT JOIN genres sg ON b.subgenre_id = sg.id
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
  const {
    title,
    description,
    meta_title,
    meta_description,
    meta_keywords,
    cover_image,
    status,
    genre_id,     
    subgenre_id    
  } = bookData;

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

    if (genre_id !== undefined) {
    updates.push('genre_id = ?');
    params.push(genre_id || null);
  }
  if (subgenre_id !== undefined) {
    updates.push('subgenre_id = ?');
    params.push(subgenre_id || null);
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

   // Удаляем все главы этой книги (и их картинки)
  const chapters = await Chapter.getBookChapters(id);
  for (const chapter of chapters) {
    await Chapter.deleteChapter(chapter.id);
  }

    // Удаляем связанные изображения
  const images = await Image.getByBook(id);
  for (const img of images) {
    await deleteImage(path.join(__dirname, '../../client', img.file_path));
    // удалить запись из images
    await Image.deleteById(img.id);
  }
  
  // Удаляем "потерянные" изображения пользователя
  if (authorId) {
    const orphanedImages = await Image.getOrphanedImages(authorId);
    for (const img of orphanedImages) {
      await deleteImage(path.join(__dirname, '../../client', img.file_path));
      await Image.deleteById(img.id);
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

async function getAllBooksFiltered({ genre_id, subgenre_id, author, q, sort }) {
  let sql = `
    SELECT b.*, 
           u.username as author_name, 
           u.display_name as author_display_name,
           g.name as genre_name, 
           sg.name as subgenre_name
    FROM books b
    JOIN users u ON b.author_id = u.id
    LEFT JOIN genres g ON b.genre_id = g.id
    LEFT JOIN genres sg ON b.subgenre_id = sg.id
    WHERE b.status IN ('in_progress', 'completed')
  `;
  const params = [];

  if (genre_id) {
    sql += ' AND b.genre_id = ?';
    params.push(genre_id);
  }
  if (subgenre_id) {
    sql += ' AND b.subgenre_id = ?';
    params.push(subgenre_id);
  }
  if (author) {
    sql += ' AND u.username LIKE ?';
    params.push(`%${author}%`);
  }
  if (q) {
    sql += ' AND (b.title LIKE ? OR u.username LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }

  if (sort === 'date_asc') {
    sql += ' ORDER BY b.created_at ASC';
  } else {
    sql += ' ORDER BY b.created_at DESC';
  }

  return convertBigIntToNumber(await query(sql, params));
}

module.exports = {
  createBooksTable,
  createBook,
  getBookById,
  getAllBooks,
  updateBook,
  deleteBook,
  incrementBookViews,
  getAllBooksFiltered
};