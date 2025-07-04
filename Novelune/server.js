const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const { query } = require("./server/config/database");
const User = require("./server/models/user");
const authRoutes = require("./server/routes/auth");
const exphbs = require("express-handlebars");
const cookieParser = require("cookie-parser");
const avatarRoutes = require("./server/routes/avatar");
const userRoutes = require("./server/routes/user");
const { createGenresTable, seedGenres } = require("./server/models/genre");
//const csurf = require('csurf'); // CSRF защита TODO, не успела настроить
const helmet = require("helmet"); // Защита от XSS и других атак

// Переопределение JSON.stringify для обработки BigInt
BigInt.prototype.toJSON = function () {
  return Number(this);
};

// для работы переменных окружения
dotenv.config();

// Проверка, что переменные окружения загружены
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_NAME:", process.env.DB_NAME);

const app = express();
const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 3007;

// Настраиваем Handlebars
const hbs = exphbs.create({
  defaultLayout: "main",
  extname: ".hbs",
  helpers: {
    // Форматирование даты
    formatDate: function (date) {
      return date ? new Date(date).toLocaleDateString("ru-RU") : "";
    },
    // Сравнение значений
    eq: function (a, b) {
      return a === b;
    },
    and: function (a, b) {
      return a && b;
    },
    // Функция для создания секций в шаблонах
    section: function (name, options) {
      if (!this._sections) this._sections = {};
      this._sections[name] = options.fn(this);
      return null;
    },
    // Текущий год для футера
    currentYear: function () {
      return new Date().getFullYear();
    },
    json: function (context) {
      return JSON.stringify(context);
    },
  },
});

// от limiter
// Ограничение количества запросов для защиты от DDoS атак
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 500, // максимум 500 запросов с одного IP
});

// Регистрируем Handlebars в Express
app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// Настраиваем middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "client")));
app.use("/shared", express.static(path.join(__dirname, "shared")));
app.use("/js", express.static(path.join(__dirname, "client/js")));

app.use("/api/auth", authRoutes);
app.use("/api/avatar", avatarRoutes);
app.use("/api/user", userRoutes);
app.use("/uploads", express.static(path.join(__dirname, "client/uploads")));
app.use("/images", express.static(path.join(__dirname, "client/images")));

// app.use(csurf({ cookie: true })); // CSRF защита, TODO
// app.use(helmet());
app.use(limiter);

// Настройка Helmet в зависимости от окружения, а то пытался работыть в https
if (process.env.NODE_ENV === "development") {
  app.use(
    helmet({
      contentSecurityPolicy: false, // Отключаем CSP
      strictTransportSecurity: false, // Отключаем HSTS для разработки
    })
  );
} else {
  app.use(helmet()); // для продакшена полную защиту
}

// Проверка подключения к базе
app.get("/api/test-db", async (req, res) => {
  try {
    // Простой запрос для проверки соединения
    const result = await query("SELECT 1 + 1 AS solution");

    // Попробуем создать таблицу пользователей
    await User.createUsersTable();

    res.json({
      success: true,
      dbConnected: true,
      solution: result[0].solution,
      message: "Подключение к базе данных работает",
    });
  } catch (error) {
    console.error("Ошибка при подключении к базе данных:", error);
    res.status(500).json({
      success: false,
      dbConnected: false,
      error: error.message,
      message: "Проблема с подключением к базе данных",
    });
  }
});

const pagesRoutes = require("./server/routes/pages");
app.use("/", pagesRoutes);

// Обработка 404 ошибки для неизвестных маршрутов (добавить перед тестом БД)
app.use((req, res) => {
  res.status(404).render("pages/404", {
    title: "404 - Страница не найдена",
  });
});

// Инициализация базы данных при запуске
(async () => {
  try {
    console.log("Инициализация базы данных...");
    await User.createUsersTable();
    console.log("Таблица пользователей проверена/создана");

    // инициализация таблицы книг
    const Book = require("./server/models/book");
    await Book.createBooksTable();
    console.log("Таблица книг проверена/создана");

    // инициализация таблицы глав
    const Chapter = require("./server/models/chapter");
    await Chapter.createChaptersTable();
    console.log("Таблица глав проверена/создана");

    // инициализация таблицы изображений
    const Image = require("./server/models/image");
    await Image.createImagesTable();
    console.log("Таблица изображений проверена/создана");

    // инициализация таблицы жанров
    await createGenresTable();
    // await seedGenres(); // если нужно заполнить жанры, но сразу выключить, а то будет добавлять при каждом рестарте
    console.log("Таблица жанров проверена/создана и заполнена");
  } catch (error) {
    console.error("Ошибка при инициализации БД:", error);
  }
})();

// Экспортируем приложение для тестов
module.exports = app;

// Запускаем сервер только если файл запущен напрямую (не через require)
if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Novelune сервер запущен: http://${HOST}:${PORT}`);
  });
}

// Запуск сервера
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`Novelune сервер запущен: http://${HOST}:${PORT}`);
// });
