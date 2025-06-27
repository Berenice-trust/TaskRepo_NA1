const { query } = require('../config/database');

async function createGenresTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS genres (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      parent_id INT DEFAULT NULL,
      FOREIGN KEY (parent_id) REFERENCES genres(id) ON DELETE SET NULL
    )
  `;
  return await query(sql);
}



async function seedGenres() {
  const genres = [
    { name: 'Фантастика', parent_id: null },
    { name: 'Детектив', parent_id: null },
    { name: 'Роман', parent_id: null },
    { name: 'Фэнтези', parent_id: null },
    { name: 'Приключения', parent_id: null },
    { name: 'Киберпанк', parent_id: 1 },
    { name: 'Космоопера', parent_id: 1 },
    { name: 'Полицейский', parent_id: 2 },
    { name: 'Любовный роман', parent_id: 3 },
    { name: 'Героическое фэнтези', parent_id: 4 }
  ];
  for (const genre of genres) {
    await query('INSERT INTO genres (name, parent_id) VALUES (?, ?)', [genre.name, genre.parent_id]);
  }
}

async function getAllGenres() {
  const sql = 'SELECT * FROM genres';
  return await query(sql);
}

module.exports = { createGenresTable, seedGenres, getAllGenres };