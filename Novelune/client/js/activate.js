document.addEventListener('DOMContentLoaded', async () => {
    const statusElement = document.getElementById('activationStatus');
    
    // Получаем токен из URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
      statusElement.className = 'status error';
      statusElement.textContent = 'Ошибка: Отсутствует токен активации';
      return;
    }
    
    try {
      const response = await fetch(`/api/auth/activate/${token}`);
      const data = await response.json();
      
      if (data.success) {
        statusElement.className = 'status success';
        statusElement.innerHTML = `
          <p>${data.message}</p>
          <p>Теперь вы можете <a href="/login">войти в систему</a>.</p>
        `;
      } else {
        statusElement.className = 'status error';
        statusElement.textContent = data.message || 'Ошибка при активации аккаунта';
      }
    } catch (error) {
      statusElement.className = 'status error';
      statusElement.textContent = 'Ошибка сервера при активации аккаунта';
    }
  });