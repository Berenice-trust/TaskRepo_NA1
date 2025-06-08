// правила валидации
const validators = {
  username: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_]+$/,
    validate: function(username) {
      if (!username) return 'Имя пользователя обязательно';
      if (username.length < this.minLength) return `Минимальная длина ${this.minLength} символов`;
      if (username.length > this.maxLength) return `Максимальная длина ${this.maxLength} символов`;
      if (!this.pattern.test(username)) return 'Только буквы, цифры и символ подчеркивания';
      return null; // Нет ошибки
    }
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    validate: function(email) {
      if (!email) return 'Email обязателен';
      if (!this.pattern.test(email)) return 'Некорректный формат email';
      return null;
    }
  },
  password: {
    minLength: 8,
    validate: function(password) {
      if (!password) return 'Пароль обязателен';
      if (password.length < this.minLength) return `Минимальная длина пароля ${this.minLength} символов`;
      return null;
    }
  }
};

// Валидация объекта 
function validateUser(userData) {
  const errors = {};
  
  const usernameError = validators.username.validate(userData.username);
  if (usernameError) errors.username = usernameError;
  
  const emailError = validators.email.validate(userData.email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validators.password.validate(userData.password);
  if (passwordError) errors.password = passwordError;
  
  return Object.keys(errors).length > 0 ? errors : null;
}

// Экспорт для разных окружений
if (typeof module !== 'undefined' && module.exports) {
  // Для Node.js
  module.exports = { validators, validateUser };
} else {
  // Для браузера
  window.validation = { validators, validateUser };
}