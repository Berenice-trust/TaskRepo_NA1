const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { sendVerificationEmail } = require("../services/email.service");
const { query } = require("../config/database");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

router.post("/register", async (req, res) => {
  try {
    // Получаем данные из запроса
    const { username, email, password } = req.body;

    // Создаем нового пользователя
    const newUser = await User.createUser({
      username,
      email,
      password,
    });

    // Отправляем email для подтверждения
    try {
      await sendVerificationEmail(email, username, newUser.verificationToken);
      console.log(`Письмо с подтверждением отправлено на ${email}`);
    } catch (emailError) {
      console.error("Ошибка при отправке письма:", emailError);
      // Продолжаем выполнение даже если письмо не отправлено
      // В реальном приложении можно добавить повторную отправку писем
    }

    res.status(201).json({
      success: true,
      message: "Регистрация успешна! Проверьте почту для активации аккаунта.",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    // Проверяем валидационные ошибки
    try {
      const validationErrors = JSON.parse(error.message);
      return res.status(400).json({
        success: false,
        errors: validationErrors,
      });
    } catch {
      // Другие ошибки
      res.status(500).json({
        success: false,
        message: error.message || "Ошибка при регистрации пользователя",
      });
    }
  }
});

router.get("/activate/:token", async (req, res) => {
  try {
    const { token } = req.params;

    await User.activateUser(token);

    res.status(200).json({
      success: true,
      message: "Аккаунт успешно активирован!",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Ошибка при активации аккаунта",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: "Необходимо указать логин и пароль",
      });
    }

    // Проверяем, является ли login email-адресом
    const isEmail = login.includes("@");

    // Ищем пользователя
    let users;
    if (isEmail) {
      users = await query("SELECT * FROM users WHERE email = ?", [login]);
    } else {
      users = await query("SELECT * FROM users WHERE username = ?", [login]);
    }

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Неверный логин или пароль",
      });
    }

    const user = users[0];

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Неверный логин или пароль",
      });
    }

    // Проверяем, активирован ли аккаунт
    if (user.is_active === 0) {
      return res.status(403).json({
        success: false,
        message: "Аккаунт не активирован. Пожалуйста, проверьте вашу почту.",
      });
    }

    // Создаем JWT-токен
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role || "user",
      },
      process.env.SESSION_SECRET || "default-secret",
      { expiresIn: "24h" }
    );

    // Продакшен-безопасный вариант установки куки
    res.cookie("authToken", token, {
      httpOnly: true, // для безопасности!
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
      path: "/",
    });

    // Отправляем ответ
    res.json({
      success: true,
      message: "Вход выполнен успешно",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Ошибка при входе:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при обработке запроса",
    });
  }
});

// router.post('/logout', (req, res) => {
//   res.clearCookie('authToken', { path: '/' });
//   res.json({ success: true });
// });

// Вот это точно сработает:
router.post("/logout", (req, res) => {
  res.cookie("authToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  res.json({ success: true });
});

router.get("/users", async (req, res) => {
  try {
    const users = await query(
      "SELECT id, username, email, is_active, role FROM users"
    );

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Ошибка при получении списка пользователей:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при получении списка пользователей",
      error: error.message,
    });
  }
});

router.get("/create-test-user", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        message:
          "Создание тестового пользователя запрещено в production режиме",
      });
    }
    // Дополнительная проверка для тестовой среды
    if (
      process.env.NODE_ENV === "test" &&
      !process.env.DB_NAME.includes("test")
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Операция запрещена: тестовая среда использует не тестовую базу данных",
      });
    }
    // Параметры тестового пользователя
    const username = "testuser";
    const email = "test@example.com";
    const password = "password123";
    const hashedPassword = await bcrypt.hash(password, 10);

    // Проверяем, существует ли пользователь
    const existingUsers = await query(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUsers.length > 0) {
      // Если пользователь существует, активируем его
      await query(
        "UPDATE users SET is_active = 1 WHERE username = ? OR email = ?",
        [username, email]
      );

      return res.json({
        success: true,
        message: "Существующий тестовый пользователь активирован",
        user: {
          username,
          email,
          password,
        },
      });
    }

    // Создаем нового тестового пользователя
    const result = await query(
      "INSERT INTO users (username, email, password, is_active, role) VALUES (?, ?, ?, ?, ?)",
      [username, email, hashedPassword, 1, "user"]
    );

    res.json({
      success: true,
      message: "Тестовый пользователь создан",
      user: {
        id: result.insertId,
        username,
        email,
        password,
      },
    });
  } catch (error) {
    console.error("Ошибка при создании тестового пользователя:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при создании тестового пользователя",
      error: error.message,
    });
  }
});

router.get("/db-info", (req, res) => {
  // Отправляем только общую информацию о БД, без конфиденциальных данных
  res.json({
    dbInfo: {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
    },
  });
});

// Оставьте существующий module.exports = router; на своем месте

module.exports = router;
