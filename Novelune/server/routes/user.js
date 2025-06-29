const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/user');
const router = express.Router();
const { validateProfileUpdate } = require('../../shared/validation');

router.post('/delete', auth, async (req, res) => {
  try {
    await User.deleteUser(req.user.id);
    res.clearCookie('token');
    res.json({ success: true, message: 'Пользователь и аватар удалены' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Ошибка удаления пользователя' });
  }
});

router.post('/profile', auth, async (req, res) => {
  try {
     const errors = validateProfileUpdate(req.body);
    if (errors) {
      return res.status(400).json({ success: false, errors });
    }

      // Проверка уникальности email
    if (await User.isEmailTaken(req.body.email, req.user.id)) {
      return res.status(400).json({
        success: false,
        errors: { email: 'Этот email уже используется другим пользователем' }
      });
    }
    
// TODO: письмло с подтверждением email, если email изменен

   await User.updateProfile(
      req.user.id,
      req.body.display_name,
      req.body.email,
      req.body.bio,
      req.body.new_password // undefined если не меняется
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Ошибка обновления профиля' });
  }
});

module.exports = router;