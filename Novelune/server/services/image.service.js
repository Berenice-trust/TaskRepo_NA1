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

async function saveImage({ buffer, destFolder, filename, resize = null, quality = 80 }) {
  if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });
  const filePath = path.join(destFolder, filename);

  let img = sharp(buffer);
  if (resize) img = img.resize(resize.width, resize.height, { fit: 'cover' });
  await img.jpeg({ quality }).toFile(filePath);

  return filePath;
}

async function deleteImage(filePath) {
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (e) { console.error('Ошибка удаления файла:', filePath, e); }
  }
}


module.exports = { saveAvatar, getAvatarPaths, saveImage, deleteImage };