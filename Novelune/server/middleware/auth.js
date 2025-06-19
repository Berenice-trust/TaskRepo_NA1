const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Получаем токен из заголовка или из куки
  const token = 
    req.header('Authorization')?.replace('Bearer ', '') || 
    req.cookies?.authToken;
  
  // Если токена нет, перенаправляем на страницу входа
  if (!token) {
    return res.redirect('/login');
  }

  try {
    // Верифицируем токен
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    
    // Добавляем информацию о пользователе в req
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };
    
    next();
  } catch (err) {
    // Если токен невалидный, перенаправляем на страницу входа
    return res.redirect('/login');
  }
};