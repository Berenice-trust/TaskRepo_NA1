const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const AVATAR_DIR = path.join(__dirname, '../../client/uploads/avatars');

function getAvatarPaths(userId) {
  return {
    original: path.join(AVATAR_DIR, `avatar_${userId}.jpg`),
    thumb: path.join(AVATAR_DIR, `avatar_${userId}_thumb.jpg`)
  };
}

async function saveAvatar(userId, buffer) {
  if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });

  const { original, thumb } = getAvatarPaths(userId);

  // Удаляем старые файлы
  [original, thumb].forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });

  // Сохраняем оригинал
  await sharp(buffer).jpeg({ quality: 90 }).toFile(original);

  // Сохраняем сжатую копию (128x128)
  await sharp(buffer).resize(128, 128).jpeg({ quality: 80 }).toFile(thumb);

  // Возвращаем относительный путь к thumb для хранения в БД
  return `/uploads/avatars/avatar_${userId}_thumb.jpg`;
}

module.exports = { saveAvatar, getAvatarPaths };