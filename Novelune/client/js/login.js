document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const statusElement = document.getElementById('loginStatus');
  
  if (loginForm) {
    const loginInput = document.getElementById('loginInput');
    const passwordInput = document.getElementById('passwordInput');
    const loginError = document.getElementById('loginError');
    const passwordError = document.getElementById('passwordError');
    
    // Функция очистки всех сообщений об ошибках
    function clearErrors() {
      loginError.textContent = '';
      passwordError.textContent = '';
      statusElement.style.display = 'none';
    }
    
    // Валидация полей формы
    function validateForm() {
      clearErrors();
      
      let isValid = true;
      const login = loginInput.value.trim();
      const password = passwordInput.value;
      
      if (!login) {
        loginError.textContent = 'Введите логин или email';
        isValid = false;
      }
      
      const passwordValidationResult = validation.validators.password.validate(password);
      if (passwordValidationResult) {
        passwordError.textContent = passwordValidationResult;
        isValid = false;
      }
      
      return isValid;
    }
    
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Проверяем валидность формы
      if (!validateForm()) {
        return;
      }
      
      const login = loginInput.value.trim();
      const password = passwordInput.value;
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ login, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Сохраняем токен и данные пользователя в localStorage
          if (data.token) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('username', data.user.username);
            localStorage.setItem('userRole', data.user.role || 'user');
          }
          
          // Показываем сообщение об успешном входе
          statusElement.className = 'status success';
          statusElement.textContent = 'Вход выполнен успешно! Перенаправление...';
          statusElement.style.display = 'block';
          
          // Перенаправляем на страницу дашборда через 1 секунду
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        } else {
          // Показываем ошибку
          statusElement.className = 'status error';
          statusElement.textContent = data.message || 'Ошибка при входе';
          statusElement.style.display = 'block';
        }
      } catch (error) {
        console.error('Ошибка при входе:', error);
        statusElement.className = 'status error';
        statusElement.textContent = 'Ошибка сервера при обработке запроса';
        statusElement.style.display = 'block';
      }
    });
  }
});