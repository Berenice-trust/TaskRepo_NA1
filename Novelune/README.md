# Novelune

**Novelune** — литературная платформа для публикации и чтения произведений. Проект позволяет авторам создавать книги с главами, управлять текстовым контентом, загружать обложки и изображения.

![Novelune Logo](client/images/default-cover.png)

---

## Содержание

- [Архитектура](#архитектура)
- [Установка и запуск](#установка-и-запуск)
  - [Локальная разработка](#локальная-разработка)
  - [Деплой на сервер](#деплой-на-сервер)
- [Структура проекта](#структура-проекта)
- [Структура базы данных](#структура-базы-данных)
- [API и маршруты](#api-и-маршруты)
- [Тестирование](#тестирование)
  - [Юнит и интеграционные тесты](#юнит-и-интеграционные-тесты)
  - [Нагрузочное тестирование](#нагрузочное-тестирование)
- [Безопасность](#безопасность)
- [Автор](#автор)

---

## Архитектура

Novelune построен на основе классической MVC архитектуры с использованием следующих технологий:

**Backend:**
- Node.js / Express.js - серверная платформа и фреймворк
- Handlebars (express-handlebars) - шаблонизатор
- MariaDB - СУБД
- JWT - для аутентификации

**Frontend:**
- HTML, CSS, JavaScript (vanilla)
- Responsive дизайн
- TinyMCE - WYSIWYG-редактор для глав

**Загрузка файлов:**
- multer - для обработки multipart/form-data
- sharp - для обработки изображений

**Безопасность:**
- helmet - защита от XSS атак
- express-rate-limit - от DDoS атак
- bcrypt - хеширование паролей
- csurf (не реализовано пока) - CSRF защита

## Кеширование и отдача статики
- Статика (`/css/`, `/js/`, `/images/`, `/uploads/`, `/fonts/`) отдается nginx с кешированием в браузере на 30 дней.
- API (`/api/`, только GET/HEAD) кешируется nginx на сервере на 1 минуту.
- Для SSR-страниц кеширование не используется.

**Настройки находятся в файле:**  
`/etc/nginx/sites-enabled/novelune`

**Прочее:**
- nodemailer - для отправки email
- dotenv - для конфигурации

---

## Установка и запуск

### Локальная разработка

1. **Клонировать репозиторий:**
   ```
   git clone <repository-url>
   cd Novelune
   ```

2. **Установить зависимости:**
   ```
   npm install
   ```

3. **Настроить переменные окружения:**
   - Скопировать файл `.env.example` в файл `.env`
   - Заполнить необходимые значения (DB_USER, DB_PASSWORD и т.д.)

4. **Создать базу данных:**
   - Создайте базу данных в MariaDB/MySQL с именем, указанным в DB_NAME
   - Таблицы будут созданы автоматически при первом запуске

5. **Запустить в режиме разработки:**
   ```
   npm run dev
   ```

6. **Приложение будет доступно по адресу:**
   ```
   http://localhost:3007
   ```

### Деплой на сервер

1. **Настройка Nginx как обратного прокси:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3007;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

2. **Запуск приложения на сервере:**
   ```
   npm start
   ```

   Для запуска в фоновом режиме рекомендуется использовать PM2:
   ```
   npm install -g pm2
   pm2 start server.js --name novelune
   ```

---

## Структура проекта

```
Novelune/
├── client/                # Клиентские файлы
│   ├── css/               # CSS стили
│   ├── images/            # Статические изображения
│   ├── js/                # Клиентские скрипты
│   └── uploads/           # Загруженные пользователем файлы
│       ├── covers/        # Обложки книг
│       └── images/        # Изображения для глав
├── server/                # Серверный код
│   ├── config/            # Конфигурация
│   ├── middleware/        # Middleware
│   ├── models/            # Модели для работы с БД
│   ├── repositories/      # Репозитории
│   ├── routes/            # Маршруты API
│   ├── services/          # Сервисы
│   └── utils/             # Утилиты
├── shared/                # Общий код для клиента и сервера
│   └── validation.js      # Валидация данных
├── tests/                 # Тесты
│   ├── setup.js           # Настройка тестовой среды
│   ├── auth/              # Тесты для аутентификации
│   ├── books/             # Тесты для книг
│   ├── chapters/          # Тесты для глав
│   ├── db/                # Тесты для базы данных
│   └── users/             # Тесты для пользователей
├── views/                 # Шаблоны Handlebars
│   ├── layouts/           # Шаблоны макетов
│   ├── pages/             # Шаблоны страниц
│   └── partials/          # Частичные шаблоны
├── .env                   # Переменные окружения
├── .env.example           # Пример переменных окружения
├── .env.test              # Переменные окружения для тестов
├── jest.config.js         # Конфигурация Jest
├── load-test.js           # Нагрузочное тестирование (k6)
├── package.json           # Зависимости и скрипты
├── README.md              # Этот файл
└── server.js              # Точка входа
```

---

## Структура базы данных

### users
| Поле | Тип | Описание |
|------|-----|----------|
| id | INT | PK, AUTO_INCREMENT |
| username | VARCHAR(50) | Уникальный логин |
| email | VARCHAR(100) | Уникальный email |
| password | VARCHAR(255) | Хеш пароля |
| role | ENUM('user', 'admin', 'editor') | Роль пользователя |
| is_active | BOOLEAN | Активирован ли аккаунт |
| verification_token | VARCHAR(100) | Токен для активации аккаунта |
| avatar_url | VARCHAR(255) | Путь к аватару |
| bio | TEXT | О себе |
| display_name | VARCHAR(100) | Отображаемое имя |
| created_at | TIMESTAMP | Дата создания |

### books
| Поле | Тип | Описание |
|------|-----|----------|
| id | INT | PK, AUTO_INCREMENT |
| title | VARCHAR(255) | Название книги |
| description | TEXT | Описание/аннотация |
| meta_title | VARCHAR(100) | SEO-заголовок |
| meta_description | VARCHAR(200) | SEO-описание |
| meta_keywords | VARCHAR(200) | SEO-ключевые слова |
| cover_image | VARCHAR(255) | Имя файла обложки |
| author_id | INT | FK → users(id) |
| genre_id | INT | FK → genres(id) |
| subgenre_id | INT | FK → genres(id) |
| status | ENUM('draft', 'in_progress', 'completed') | Статус книги |
| views | INT | Количество просмотров |
| likes | INT | Количество лайков |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

### chapters
| Поле | Тип | Описание |
|------|-----|----------|
| id | INT | PK, AUTO_INCREMENT |
| book_id | INT | FK → books(id) |
| title | VARCHAR(255) | Название главы |
| content | TEXT | Содержимое главы (HTML) |
| chapter_number | INT | Порядковый номер главы |
| status | ENUM('draft', 'published') | Статус главы |
| views | INT | Количество просмотров |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

### genres
| Поле | Тип | Описание |
|------|-----|----------|
| id | INT | PK, AUTO_INCREMENT |
| name | VARCHAR | Название жанра |
| parent_id | INT | FK → genres(id) для поджанров |

### images
| Поле | Тип | Описание |
|------|-----|----------|
| id | INT | PK, AUTO_INCREMENT |
| file_path | VARCHAR | Путь к файлу |
| original_name | VARCHAR | Оригинальное имя файла |
| book_id | INT | FK → books(id) |
| chapter_id | INT | FK → chapters(id) |
| user_id | INT | FK → users(id) |

---

## API и маршруты

### Аутентификация и пользователи
- `GET /login` - страница входа
- `GET /register` - страница регистрации
- `GET /activate` - страница активации аккаунта
- `POST /api/auth/register` - регистрация пользователя
- `POST /api/auth/login` - вход в систему
- `POST /api/auth/logout` - выход из системы
- `GET /api/auth/activate/:token` - активация аккаунта
- `GET /dashboard` - личный кабинет
- `POST /api/user/profile` - обновление профиля
- `POST /api/avatar/upload` - загрузка аватара

### Книги
- `GET /books` - список всех книг
- `GET /books/new` - форма создания книги
- `POST /books/new` - создание новой книги
- `GET /books/:id` - страница книги (для автора)
- `POST /books/:id/edit` - редактирование книги
- `POST /books/:id/delete` - удаление книги
- `POST /books/:id/cover` - замена обложки книги

### Главы
- `GET /books/:bookId/chapters/new` - форма создания главы
- `POST /books/:bookId/chapters/new` - добавление новой главы
- `GET /books/:bookId/chapters/:chapterId/edit` - редактирование главы
- `POST /books/:bookId/chapters/:chapterId/edit` - сохранение изменений главы
- `POST /books/:bookId/chapters/:chapterId/delete` - удаление главы
- `GET /books/:bookId/chapters/:chapterId/read` - чтение главы

### Публичные страницы
- `GET /` - главная страница
- `GET /books` - каталог книг с фильтрами
- `GET /books/:id` - публичная страница книги

### Изображения
- `POST /api/images/upload` - загрузка изображений для WYSIWYG-редактора

### Вспомогательные маршруты
- `GET /api/test-db` - проверка подключения к базе данных
- `GET /api/auth/users` - получение списка пользователей (для отладки)
- `GET /api/auth/create-test-user` - создание тестового пользователя (для отладки)

---

## Тестирование

### Юнит и интеграционные тесты

Для тестирования используется Jest и supertest. Тесты находятся в директории `/tests`.

**Настройка тестового окружения:**
1. Создайте отдельную тестовую базу данных
2. Скопируйте `.env.test.example` в `.env.test` и настройте подключение к тестовой базе

**Запуск тестов:**
```
npm test
```

**Запуск тестов с автоматическим перезапуском при изменении кода:**
```
npm run test:watch
```

**Особенности тестирования:**
- Тесты используют транзакции для изоляции тестовых данных
- После всех тестов происходит очистка тестовой базы данных
- Настройка тестов находится в `/tests/setup.js`

### Нагрузочное тестирование

Для нагрузочного тестирования используется k6. Файл конфигурации - `load-test.js`.

**Установка k6:**
```
# MacOS
brew install k6

# Ubuntu/Debian
sudo apt install k6

# Windows
choco install k6
```

**Запуск нагрузочного теста локально:**
```
k6 run --vus 10 --duration 10s load-test.js
```

**Запуск на сервере:**
```
BASE_URL=http://your-domain.com/ k6 run --vus 10 --duration 10s load-test.js
```

Параметры:
- `--vus 10` - 10 виртуальных пользователей одновременно
- `--duration 10s` - продолжительность теста 10 секунд
- `BASE_URL` - адрес тестируемого сервера

---

## Безопасность

В проекте реализованы следующие механизмы безопасности:

- **helmet** - защита от XSS-атак через HTTP-заголовки
- **express-rate-limit** - защита от DDoS-атак и брутфорса
- **bcrypt** - безопасное хранение паролей
- **JWT** - безопасная аутентификация
- **Валидация данных** - защита от инъекций
- **csurf** - защита от CSRF-атак (отключена в dev-режиме)

---

## Работа с PM2

Для управления сервером используется [PM2](https://pm2.keymetrics.io/):

- **Запуск приложения:**
  ```
  pm2 start server.js --name novelune
  ```
- **Перезапуск приложения:**
  ```
  pm2 restart novelune
  ```
- **Просмотр логов:**
  ```
  pm2 logs novelune
  ```
- **Сохранение состояния:**
  ```
  pm2 save
  ```
- **Автоматический запуск при перезагрузке:**
  ```
  pm2 startup
  ```
---

## Бэкап и восстановление

- **Автоматический бэкап** базы данных и пользовательских файлов выполняется на сервере каждый день в 3:00 ночи.
- Все резервные копии сохраняются в папке `/home/root/TaskRepo_NA1/Novelune/backups`.

---

## Автор

Житник Вероника, 2025

---

**Примечание:** Для боевого использования рекомендуется дополнительно настроить HTTPS с SSL-сертификатами и включить CSRF защиту.