const { query } = require("../config/database");

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
  create: async function ({
    file_path,
    original_name,
    book_id = null,
    user_id = null,
    chapter_id = null,
  }) {
    const result = await query(
      `INSERT INTO images (file_path, original_name, book_id, user_id, chapter_id)
       VALUES (?, ?, ?, ?, ?)`,
      [file_path, original_name, book_id, user_id, chapter_id]
    );
    return result.insertId;
  },

  getById: async function (id) {
    const rows = await query("SELECT * FROM images WHERE id = ?", [id]);
    return rows[0] || null;
  },

  getByBook: async function (book_id) {
    return await query("SELECT * FROM images WHERE book_id = ?", [book_id]);
  },

  getByUser: async function (user_id) {
    return await query("SELECT * FROM images WHERE user_id = ?", [user_id]);
  },

  getByChapter: async function (chapter_id) {
    return await query("SELECT * FROM images WHERE chapter_id = ?", [
      chapter_id,
    ]);
  },

  getOrphanedImages: async function (userId = null) {
    let sql =
      "SELECT * FROM images WHERE chapter_id IS NULL AND book_id IS NULL";
    const params = [];

    if (userId) {
      sql += " AND user_id = ?";
      params.push(userId);
    }

    return await query(sql, params);
  },
};

async function deleteById(id) {
  await query("DELETE FROM images WHERE id = ?", [id]);
}
Image.deleteById = deleteById;

Image.updateChapterIdByPath = async function (file_path, chapter_id, book_id) {
  if (file_path.includes("?")) {
    file_path = file_path.split("?")[0];
  }

  // Обработка всех возможных форматов пути
  let cleanPath = file_path;

  // Если путь содержит домен - удаляем его
  if (cleanPath.includes("://")) {
    cleanPath = "/" + cleanPath.split("/").slice(3).join("/");
  }

  // Если путь не начинается с / - добавляем его
  if (!cleanPath.startsWith("/")) {
    cleanPath = "/" + cleanPath;
  }

  console.log("Очищенный путь для поиска в БД:", cleanPath);

  // Пытаемся найти по полному пути
  let result = await query(
    "UPDATE images SET chapter_id = ?, book_id = ? WHERE file_path = ?",
    [chapter_id, book_id, cleanPath]
  );

  console.log("Результат обновления:", result.affectedRows, "строк");

  // Если не нашли, пробуем найти по имени файла без расширения
  if (result.affectedRows === 0) {
    // Получаем имя файла без расширения и без параметров
    const filename = cleanPath.split("/").pop().split(".")[0];
    console.log("Поиск по имени файла (без расширения):", filename);

    await query(
      "UPDATE images SET chapter_id = ?, book_id = ? WHERE file_path LIKE ?",
      [chapter_id, book_id, "%" + filename + "%"]
    );
  }
};

module.exports = Image;
