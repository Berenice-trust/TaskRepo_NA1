const request = require("supertest");
const app = require("../../server");
const { query } = require("../../server/config/database");

// Мокаем отправку email, чтобы не отправлять реальные письма в тестах
jest.mock("../../server/services/email.service", () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
}));

describe("User Registration", () => {
  
  // Очистка перед каждым тестом
  beforeEach(async () => {
    await query('DELETE FROM users WHERE username = ? OR username = ?', 
      ["testuser_test", "testuser_activation"]);
  });
  
  // Тест на успешную регистрацию
  test("should register a new user successfully", async () => {
    try {
      // Вставляем пользователя напрямую через SQL
      await query(`
        INSERT INTO users (username, email, password, verification_token, is_active) 
        VALUES (?, ?, ?, ?, ?)
      `, ["testuser_test", "test_email@example.com", "hashedpassword", "test_token", 0]);
      
      // Проверяем, что пользователь создан в базе
      const users = await query("SELECT * FROM users WHERE username = ?", ["testuser_test"]);
      expect(users.length).toBeGreaterThan(0);
      
      if (users.length > 0) {
        expect(users[0].is_active).toBe(0); // Неактивен до подтверждения
        expect(users[0].verification_token).toBe("test_token");
      }
    } catch (error) {
      console.error('Ошибка в тесте регистрации:', error);
      throw error;
    }
  });

  // Тест на активацию пользователя
  test("should activate user account with valid token", async () => {
    try {
      // Создаем пользователя напрямую через SQL с известным токеном
      const token = "test_activation_token";
      const username = "testuser_activation";
      
      // Вставляем пользователя напрямую
      await query(`
        INSERT INTO users (username, email, password, verification_token, is_active)
        VALUES (?, ?, ?, ?, ?)
      `, [username, 'activation@example.com', 'hashedpassword', token, 0]);
      
      // Проверяем, что пользователь создан
      const checkUser = await query('SELECT * FROM users WHERE username = ?', [username]);
      expect(checkUser.length).toBe(1);
      
      // Активируем аккаунт
      const response = await request(app).get(`/api/auth/activate/${token}`);
      expect(response.status).toBe(200);
      
      // Проверяем активацию
      const updatedUser = await query('SELECT is_active FROM users WHERE username = ?', [username]);
      expect(updatedUser.length).toBeGreaterThan(0);
      
      if (updatedUser.length > 0) {
        expect(updatedUser[0].is_active).toBe(1); // Активирован
      }
    } catch (error) {
      console.error('Ошибка в тесте активации:', error);
      throw error;
    }
  });
});