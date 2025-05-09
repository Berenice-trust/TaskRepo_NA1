// функции для тестирования
const { validateUrl, validateKeyField } = require('../shared/validators'); 

// группа тестов, первый аргумент - название группы, второй - функция
describe('validateUrl function', () => {
  
    // 1) проверяет, что функция принимает правильный URL
    test('should accept a valid URL', () => {
      // Подготовка - создаем корректный URL
      const validUrl = 'https://example.com';
      
      // Действие - вызываем тестируемую функцию
      const result = validateUrl(validUrl);
      
      // Проверка - результат должен содержать { valid: true }
      expect(result.valid).toBe(true);
    });
  
    // 2) проверяет некорректный URL
    test('should reject an invalid URL', () => {
      const invalidUrl = 'not-a-valid-url';
      const result = validateUrl(invalidUrl);
      expect(result.valid).toBe(false);
    });

    // 3) проверяет URL с некорректным вопросительным знаком в параметре
    test('should reject URL with question mark in query parameter', () => {
        const invalidUrlWithQuestionMark = 'https://www.aaa.com/?aaa=?';
        const result = validateUrl(invalidUrlWithQuestionMark);
        expect(result.valid).toBe(false);
    });

    test('should reject URL with Cyrillic characters in domain', () => {
       
        const invalidUrlWithCyrillic = 'http://www.привет.com';
        const result = validateUrl(invalidUrlWithCyrillic);
        expect(result.valid).toBe(false);
      });
  });




  // группа тестов для validateKeyField 9 (для параметров и заголовков)
describe('validateKeyField function', () => {
  
    // Тест для проверки правильного имени заголовка
    test('should accept valid HTTP header name', () => {
      const validHeaderName = 'Content-Type';
      const result = validateKeyField(validHeaderName, 'header');
      expect(result.valid).toBe(true);
    });
    
    // Тест для проверки заголовка с кириллицей
    test('should reject header name with Cyrillic characters', () => {
      const invalidHeaderName = 'Тип-Контента';
      const result = validateKeyField(invalidHeaderName, 'header');
      expect(result.valid).toBe(false);
    });
    
    // Тест для проверки заголовка со специальными символами
    test('should reject header name with special characters', () => {
      const invalidHeaderName = 'Content@Type';
      const result = validateKeyField(invalidHeaderName, 'header');
      expect(result.valid).toBe(false);
    });
  });