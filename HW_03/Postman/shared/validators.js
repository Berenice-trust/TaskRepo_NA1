// Функция для валидации
// для клиента и сервера

function validateUrl(url) {
    if (!url || url.trim() === '') {
      return {
        valid: false,
        message: 'URL не может быть пустым'
      };
    }
    
    try {
      new URL(url);
      return {
        valid: true
      };
    } catch (e) {
      return {
        valid: false,
        message: 'Некорректный URL. Должен начинаться с http:// или https://'
      };
    }
  }
  
    // для клиента
    if (typeof window !== 'undefined') {
    window.validators = {
        validateUrl: validateUrl
        };
    }
  
    // Для Node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { validateUrl };
    }