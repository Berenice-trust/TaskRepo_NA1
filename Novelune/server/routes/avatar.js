const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const { saveAvatar } = require('../services/image.service');
const User = require('../models/user');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Можно загружать только изображения!'));
    }
    cb(null, true);
  }
});

router.post('/upload', auth, upload.single('image'), async (req, res) => {
  try {
    const userId = req.user.id;
    const buffer = req.file.buffer;

    // Сохраняем аватар и получаем путь к thumb
    const avatarUrl = await saveAvatar(userId, buffer);

    // Обновляем путь в БД
    await User.updateAvatarUrl(userId, avatarUrl);

    res.redirect('/dashboard');
  } catch (err) {
    console.error('Ошибка загрузки аватара:', err);
    res.status(500).send('Ошибка загрузки аватара');
  }
});

module.exports = router;