// Функции для валидации
// общие для клиента и сервера

// валицация URL
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

  /// Валидация для ключей (параметров, заголовков)
function validateKeyField(key, fieldType = 'param') {
    if (!key || key.trim() === '') {
      return {
        valid: false,
        message: fieldType === 'param' ? 
          'Ключ параметра не может быть пустым' : 
          'Имя заголовка не может быть пустым'
      };
    }

     // Для заголовков: преобразуем ключ перед проверкой
     if (fieldType === 'header') {
        // Если содержит двоеточие, берём только часть до первого двоеточия
        if (key.includes(':')) {
          key = key.split(':')[0].trim();
        }
      }
    
    const keyPattern = /^[a-zA-Z0-9_-]+$/;
    if (!keyPattern.test(key)) {
      return {
        valid: false,
        message: 'Только латиница, цифры, дефис и подчеркивание'
      };
    }
    
    return { valid: true };
} 

// Валидация для значений (параметров, заголовков)
function validateValueField(value, fieldType = 'param') {
    // не пустое
    if (value === undefined || value === null) {
      return {
        valid: false,
        message: fieldType === 'param' ? 
          'Значение параметра отсутствует' : 
          'Значение заголовка отсутствует'
      };
    }
    
    return { valid: true };
}

// Валидация тела запроса
function validateRequestBody(body, contentType) {
    // Если тела нет
    if (!body || body.trim() === '') {
      return { valid: true };
    }
    
   // Валидация JSON
    if (contentType.includes('application/json')) {
      try {
        JSON.parse(body);
        return { valid: true };
      } catch (e) {
        return {
          valid: false,
          message: 'Некорректный JSON формат'
        };
      }
    }


    
    
    // Валидация x-www-form-urlencoded
     // Специальная обработка для формы
  if (contentType.includes('application/x-www-form-urlencoded')) {
    // Базовая проверка формата key=value&key2=value2
    if (body.includes('=')) {
      return { valid: true };
    } else {
      return {
        valid: false,
        message: 'Формат должен быть key=value&key2=value2'
      };
    }
  }
    
    // Для других типов контента пока не делаем специальной валидации
    return { valid: true };
  }


                                // Экспорты         
    // для клиента
    if (typeof window !== 'undefined') {
    window.validators = {
        validateUrl: validateUrl,
        validateKeyField: validateKeyField,
        validateValueField: validateValueField,
        validateRequestBody: validateRequestBody
        };
    }
  
    // Для сервера
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { 
            validateUrl, 
            validateKeyField, 
            validateValueField,
            validateRequestBody
        };
    }