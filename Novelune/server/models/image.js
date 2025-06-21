const { query } = require('../config/database');

async function createImagesTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      file_path VARCHAR(255) NOT NULL,
      original_name VARCHAR(255),
      book_id INT,
      user_id INT,
      chapter_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
    )
  `;
  return await query(sql);
}

const Image = {
  createImagesTable,
  async create({ file_path, original_name, book_id = null, user_id = null, chapter_id = null }) {
    const result = await query(
      `INSERT INTO images (file_path, original_name, book_id, user_id, chapter_id)
       VALUES (?, ?, ?, ?, ?)`,
      [file_path, original_name, book_id, user_id, chapter_id]
    );
    return result.insertId;
  },

  async getById(id) {
    const rows = await query('SELECT * FROM images WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async getByBook(book_id) {
    return await query('SELECT * FROM images WHERE book_id = ?', [book_id]);
  },

  async getByUser(user_id) {
    return await query('SELECT * FROM images WHERE user_id = ?', [user_id]);
  }
};

module.exports = Image;