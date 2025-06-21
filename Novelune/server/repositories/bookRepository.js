const { query } = require('../config/database');
const { convertBigIntToNumber } = require('../utils/data-helpers');

class BookRepository {
  async create(bookData) {
    const {
      title, description, meta_title, meta_description, meta_keywords,
      cover_image, author_id, status = 'draft'
    } = bookData;

    const sql = `
      INSERT INTO books (title, description, meta_title, meta_description, meta_keywords, cover_image, author_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      title, description, meta_title, meta_description, meta_keywords,
      cover_image, author_id, status
    ]);
    return { id: Number(result.insertId), ...bookData };
  }

  async getById(id) {
    const sql = `
      SELECT b.*, u.username as author_name
      FROM books b
      JOIN users u ON b.author_id = u.id
      WHERE b.id = ?
    `;
    const result = await query(sql, [id]);
    return result.length > 0 ? convertBigIntToNumber(result[0]) : null;
  }

  async getAll({ limit = 10, offset = 0, authorId = null, status = null } = {}) {
    let sql = `
      SELECT b.*, u.username as author_name
      FROM books b
      JOIN users u ON b.author_id = u.id
    `;
    const params = [];
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
    sql += ` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await query(sql, params);
    return convertBigIntToNumber(result);
  }

  async update(id, bookData) {
    const {
      title, description, meta_title, meta_description, meta_keywords,
      cover_image, status
    } = bookData;

    let sql = 'UPDATE books SET ';
    const params = [];
    const updates = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (meta_title !== undefined) { updates.push('meta_title = ?'); params.push(meta_title); }
    if (meta_description !== undefined) { updates.push('meta_description = ?'); params.push(meta_description); }
    if (meta_keywords !== undefined) { updates.push('meta_keywords = ?'); params.push(meta_keywords); }
    if (cover_image !== undefined) { updates.push('cover_image = ?'); params.push(cover_image); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }

    if (updates.length === 0) throw new Error('Нет данных для обновления');

    sql += updates.join(', ') + ' WHERE id = ?';
    params.push(id);

    const result = await query(sql, params);
    if (result.affectedRows === 0) throw new Error('Книга не найдена');
    return { id: Number(id), updated: true, ...bookData };
  }

  async delete(id) {
    const sql = `DELETE FROM books WHERE id = ?`;
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new BookRepository();