
const dotenv = require('dotenv');
const path = require('path');

// Загружаем переменные среды тестов в самом начале
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });
  console.log("Используем тестовую базу данных для registration.test.js:", process.env.DB_NAME);
  
  if (!process.env.DB_NAME || !process.env.DB_NAME.includes('test')) {
    console.error('⚠️ КРИТИЧЕСКАЯ ОШИБКА: Тесты используют не тестовую базу данных!');
    process.exit(1);
  }
}
const request = require("supertest");
const app = require("../../server"); // Теперь импортируем только приложение Express
const { query } = require("../../server/config/database");

// Мокаем отправку email, чтобы не отправлять реальные письма в тестах
jest.mock("../../server/services/email.service", () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
}));

describe("User Registration", () => {
  // Очистка базы и сброс счетчика ID перед каждым тестом
  beforeEach(async () => {
    await query('DELETE FROM users WHERE username LIKE "testuser%"');
    // Сбрасываем автоинкремент, если были удаления
    await query("ALTER TABLE users AUTO_INCREMENT = 1");
  });

  // Тест на успешную регистрацию
  test("should register a new user successfully", async () => {
    const response = await request(app).post("/api/auth/register").send({
      username: "testuser_test",
      email: "test_email@example.com",
      password: "securepassword123",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.user.username).toBe("testuser_test");
    expect(response.body.user.email).toBe("test_email@example.com");

    // Проверяем, что пользователь создан в базе
    const users = await query("SELECT * FROM users WHERE username = ?", [
      "testuser_test",
    ]);
    expect(users.length).toBe(1);
    expect(users[0].is_active).toBe(0); // Неактивен до подтверждения
    expect(users[0].verification_token).not.toBeNull();
  });

  // Тест на активацию
  test("should activate user account with valid token", async () => {
    // Сначала создаем пользователя
    const user = {
      username: "testuser_activation",
      email: "test_activation@example.com",
      password: "securepassword123",
    };

    await request(app).post("/api/auth/register").send(user);

    // Получаем токен из базы
    const users = await query(
      "SELECT verification_token FROM users WHERE username = ?",
      [user.username]
    );
    const token = users[0].verification_token;

    // Активируем аккаунт
    const response = await request(app).get(`/api/auth/activate/${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Проверяем, что пользователь активирован
    const updatedUsers = await query(
      "SELECT is_active FROM users WHERE username = ?",
      [user.username]
    );
    expect(updatedUsers[0].is_active).toBe(1); // Активен
  });
});
