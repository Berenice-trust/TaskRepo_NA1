document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const statusElement = document.getElementById('registerStatus');
  
  if (registerForm) {
    const usernameInput = document.getElementById('usernameInput');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    
    const usernameError = document.getElementById('usernameError');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    
    // Функция очистки всех сообщений об ошибках
    function clearErrors() {
      usernameError.textContent = '';
      emailError.textContent = '';
      passwordError.textContent = '';
      statusElement.style.display = 'none';
    }
    
    // Валидация полей формы
    function validateForm() {
      clearErrors();
      
      let isValid = true;
      const username = usernameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      
      // Используем общие функции валидации из validation.js
      const usernameValidationResult = validation.validators.username.validate(username);
      if (usernameValidationResult) {
        usernameError.textContent = usernameValidationResult;
        isValid = false;
      }
      
      const emailValidationResult = validation.validators.email.validate(email);
      if (emailValidationResult) {
        emailError.textContent = emailValidationResult;
        isValid = false;
      }
      
      const passwordValidationResult = validation.validators.password.validate(password);
      if (passwordValidationResult) {
        passwordError.textContent = passwordValidationResult;
        isValid = false;
      }
      
      return isValid;
    }
    
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Проверяем валидность формы
      if (!validateForm()) {
        return;
      }
      
      const username = usernameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Показываем сообщение об успешной регистрации
          statusElement.className = 'status success';
          statusElement.innerHTML = `
            <p>${data.message || 'Регистрация прошла успешно!'}</p>
            <p>Проверьте вашу электронную почту для активации аккаунта.</p>
          `;
          statusElement.style.display = 'block';
          
          // Очищаем форму
          registerForm.reset();
        } else {
          // Если есть валидационные ошибки, показываем их рядом с полями
          if (data.errors) {
            if (data.errors.username) usernameError.textContent = data.errors.username;
            if (data.errors.email) emailError.textContent = data.errors.email;
            if (data.errors.password) passwordError.textContent = data.errors.password;
          } else {
            // Общая ошибка
            statusElement.className = 'status error';
            statusElement.textContent = data.message || 'Ошибка при регистрации';
            statusElement.style.display = 'block';
          }
        }
      } catch (error) {
        console.error('Ошибка при регистрации:', error);
        statusElement.className = 'status error';
        statusElement.textContent = 'Ошибка сервера при обработке запроса';
        statusElement.style.display = 'block';
      }
    });
  }
});