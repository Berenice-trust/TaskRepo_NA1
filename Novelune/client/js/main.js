document.addEventListener('DOMContentLoaded', () => {
  console.log('Novelune client loaded');
  
  // Обработчик для кнопки проверки подключения к БД
  const testDbBtn = document.getElementById('testDbBtn');
  const dbStatus = document.getElementById('dbStatus');
  
  if (testDbBtn && dbStatus) {
    testDbBtn.addEventListener('click', async () => {
      dbStatus.className = 'status';
      dbStatus.textContent = 'Проверка подключения...';
      
      try {
        const response = await fetch('/api/test-db');
        const data = await response.json();
        
        if (data.success) {
          dbStatus.className = 'status success';
          dbStatus.innerHTML = `<p>${data.message}</p>
                                <p>Результат: ${data.solution}</p>`;
        } else {
          dbStatus.className = 'status error';
          dbStatus.innerHTML = `<p>${data.message}</p>
                                <p>Ошибка: ${data.error || 'Неизвестная ошибка'}</p>`;
        }
      } catch (error) {
        dbStatus.className = 'status error';
        dbStatus.textContent = `Ошибка: ${error.message}`;
      }
    });
  }
});