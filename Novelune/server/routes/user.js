const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/user');
const router = express.Router();

router.post('/delete', auth, async (req, res) => {
  try {
    await User.deleteUser(req.user.id);
    res.clearCookie('token');
    res.json({ success: true, message: 'Пользователь и аватар удалены' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Ошибка удаления пользователя' });
  }
});

module.exports = router;