const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const token = 
    req.header('Authorization')?.replace('Bearer ', '') || 
    req.cookies?.authToken;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };
  } catch (err) {
    req.user = null;
  }
  next();
};