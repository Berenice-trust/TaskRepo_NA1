const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const progress = require("progress-stream");
const WebSocket = require("ws");

const app = express();
const PORT = 3005;
const WS_PORT = 3006; // Отдельный порт для WebSocket
const CONNECTION_TIMEOUT = 300000; // 5 минут
const KEEP_ALIVE_INTERVAL = 30000;

app.use(express.static("client"));

// Файл для хранения комментариев и данных
const METADATA_FILE = "files-metadata.json";

// Функция для чтения метаданных
function readMetadata() {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      // Проверяем существует ли файл
      const data = fs.readFileSync(METADATA_FILE, "utf8");
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error("Ошибка чтения метаданных:", error);
    return {};
  }
}

// Функция для сохранения метаданных
function saveMetadata(metadata) {
  try {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error("Ошибка сохранения метаданных:", error);
  }
}

// Настройка Multer
const upload = multer({
  dest: "uploads/", // ← сюда сохраняем
});

// API Загрузка файла
app.post("/api/upload", (req, res) => {
  console.log("Начинаем загрузку файла...");

  // создаем отслеживание прогресса
  let lastSentPercent = 0; //для отслеживания последнего отправленного процента, чтобы не отправлять слишком часто
  const fileProgress = progress();
  const totalSize = +req.headers["content-length"];

  // Получаем clientId из заголовков
  const clientId = req.headers["x-client-id"];
  if (clientId) {
    fileProgress.clientId = clientId;
    console.log(`Получен clientId из заголовков: ${clientId}`);
  }

  console.log(`Общий размер запроса: ${totalSize} байт`);

  // Перенаправляем данные через progress-stream
  req.pipe(fileProgress);
  fileProgress.headers = req.headers; // копируем заголовки запроса

  // подписываемся на событие прогресса
  fileProgress.on("progress", (progressData) => {
    const percent = Math.round((progressData.transferred / totalSize) * 100);

    // Отправляем прогресс только когда процент изменился
    if (
      fileProgress.clientId &&
      (percent !== lastSentPercent ||
        (percent === 100 && percent !== lastSentPercent))
    ) {
      // Запоминаем текущий процент
      lastSentPercent = percent;

      // Вызываем функцию отправки прогресса
      sendUploadProgress(
        fileProgress.clientId,
        fileProgress.originalFilename || "файл",
        percent
      );

      // Логируем только один раз при каждом изменении процента
      console.log(
        `Прогресс отправлен: ${percent}% для клиента ${fileProgress.clientId}`
      );
    }
  });

  // multer для сохранения файла, программный вызов, поскольку мы используем progress-stream
  // возвращает midleвар для обработки прогресса
  const singleFileMiddleware = upload.single("file"); //'file' - это имя поля в форме
  // fileProgress, res, callback(c информацией о файле) - передаем модифицированный поток и ответ
  singleFileMiddleware(fileProgress, res, (err) => {
    if (err) {
      console.error("Ошибка загрузки:", err);
      return res
        .status(500)
        .json({ success: false, error: "Ошибка загрузки файла" });
    }

    // Сохраняем clientId из данных формы для использования в progress
    if (
      !fileProgress.clientId &&
      fileProgress.body &&
      fileProgress.body.clientId
    ) {
      fileProgress.clientId = fileProgress.body.clientId;
    }
    fileProgress.originalFilename = fileProgress.file.originalname;

    let originalName;
    try {
      // для русских символов
      originalName = Buffer.from(
        fileProgress.file.originalname,
        "latin1"
      ).toString("utf8");
      console.log("Исправленное имя:", originalName);
    } catch (error) {
      console.log("Не удалось исправить кодировку, используем как есть");
      originalName = fileProgress.file.originalname;
    }

    // Сохраняем метаданные
    const metadata = readMetadata();
    metadata[fileProgress.file.filename] = {
      originalName: originalName,
      comment: fileProgress.body.comment || "",
      uploadDate: new Date().toISOString(),
      size: fileProgress.file.size,
    };
    saveMetadata(metadata);

    // отправляем ответ клиенту
    res.json({
      success: true,
      message: "Файл загружен!",
      filename: fileProgress.file.filename,
      comment: fileProgress.body.comment || "",
      originalName: originalName,
    });
  });
});

// API для списка файлов
app.get("/api/files", (req, res) => {
  try {
    const metadata = readMetadata();

    const files = fs
      .readdirSync("uploads/") // читаем файлы в папке uploads
      .filter((filename) => filename !== ".gitkeep") // исключаем служебный файл .gitkeep
      .map((filename) => {
        const filePath = path.join("uploads", filename);
        const stats = fs.statSync(filePath); // получаем информацию о файле
        const meta = metadata[filename] || {};

        return {
          id: filename,
          name: meta.originalName || filename,
          size: stats.size,
          uploadDate: meta.uploadDate || stats.birthtime.toISOString(),
          comment: meta.comment || "",
        };
      });

    // ответ
    res.json({
      success: true,
      files: files,
    });
  } catch (error) {
    console.error("Ошибка чтения файлов:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка получения списка файлов",
    });
  }
});

// API для скачивания файла
app.get("/api/download/:fileId", (req, res) => {
  try {
    const fileId = req.params.fileId; // Получаем ID файла из параметров запроса
    const filePath = path.join("uploads", fileId);

    // Проверяем что файл существует
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: "Файл не найден",
      });
    }

    // Получаем оригинальное имя из метаданных
    const metadata = readMetadata();
    const meta = metadata[fileId] || {};
    const originalName = meta.originalName || fileId;

    console.log(`Скачивается файл: ${originalName} (${fileId})`);

    // Устанавливаем заголовки
    const encodedName = encodeURIComponent(originalName);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodedName}`
    ); // Указываем браузеру скачать
    res.setHeader("Content-Type", "application/octet-stream"); // универсальный тип данных

    // Отправляем файл
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error("Ошибка скачивания:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка скачивания файла",
    });
  }
});

// API для удаления файла
app.delete("/api/files/:fileId", async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const filePath = path.join("uploads", fileId);

    // Проверяем что файл существует
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: "Файл не найден",
      });
    }

    // Получаем метаданные
    const metadata = readMetadata();
    const meta = metadata[fileId] || {};
    const originalName = meta.originalName || fileId;

    // Удаляем файл с диска
    await fs.promises.unlink(filePath);

    // Удаляем метаданные
    delete metadata[fileId];
    saveMetadata(metadata);

    console.log(`Удалён файл: ${originalName} (${fileId})`);

    res.json({
      success: true,
      message: `Файл "${originalName}" удалён`,
      deletedFile: originalName,
    });
  } catch (error) {
    console.error("Ошибка удаления:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка удаления файла",
    });
  }
});

// Создаем WebSocket сервер на втором порту
const wss = new WebSocket.Server({
  host: '0.0.0.0',  // все порты
  port: WS_PORT,
  clientTracking: true, // Включаем отслеживание клиентов

  // Настройки keepAlive
  perMessageDeflate: {
    serverNoContextTakeover: true,
    clientNoContextTakeover: true,
  },
});

//проверка активности соединений
setInterval(() => {
  const now = Date.now();
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false || now - ws.lastActivity > CONNECTION_TIMEOUT) {
      console.log("Закрываем неактивное соединение");
      return ws.terminate();
    }

    ws.isAlive = false;
    try {
      ws.ping();
    } catch (e) {
      console.error("Ошибка отправки ping:", e.message);
      ws.terminate();
    }
  });
}, KEEP_ALIVE_INTERVAL);

console.log(`WebSocket сервер запущен на порту ${WS_PORT}`);

// Хранилище активных WebSocket-соединений
const wsClients = new Map();
const clientIdMappings = new Map();

// Обработчик новых соединений WebSocket
wss.on("connection", (ws) => {
  // Генерируем уникальный ID для клиента
  const clientId = Date.now().toString();
  ws.lastActivity = Date.now();

  ws.isAlive = true;

  ws.on("pong", () => {
    ws.isAlive = true;
    ws.lastActivity = Date.now();
  });

  // Хранилище соединений {clientId => WebSocket объект}
  // Используется для отправки сообщений конкретному клиенту
  wsClients.set(clientId, ws);

  console.log(`Новое WebSocket соединение: ${clientId}`);

  // Отправляем клиенту его ID
  ws.send(
    JSON.stringify({
      type: "connection",
      clientId: clientId,
    })
  );

  // Обработчик закрытия соединения
  ws.on("close", (code, reason) => {
    wsClients.delete(clientId);
    console.log(
      `WebSocket соединение закрыто: ${clientId}, код: ${code}, причина: ${
        reason || "не указана"
      }`
    );
  });

  ws.on("error", (error) => {
    console.error(`WebSocket ошибка для клиента ${clientId}:`, error.message);
  });

  ws.on("message", (message) => {
    ws.lastActivity = Date.now();
    try {
      const data = JSON.parse(message.toString());

      // Обработка сообщения о связи ID
      if (data.type === "linkIds") {
        console.log(`Связываем ID: ${data.oldId} -> ${data.newId}`);
        clientIdMappings.set(data.oldId, data.newId);
      }
    } catch (error) {
      console.error("Ошибка обработки сообщения:", error);
    }
  });
});

// Функция для отправки обновлений прогресса загрузки
function sendUploadProgress(clientId, filename, percent) {
  const mappedId = clientIdMappings.get(clientId) || clientId;

  const ws = wsClients.get(mappedId);
  if (!ws) return; // Если соединения нет, просто выходим

  if (ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(
        JSON.stringify({
          type: "uploadProgress",
          filename: filename,
          percent: percent,
        })
      );
    } catch (error) {
      console.error(`Ошибка отправки прогресса: ${error.message}`);
    }
  }
}

// Запуск  сервера
// чтобы на сервете показал правильный адрес
const isProduction = process.platform === "linux";
const HOST = isProduction ? "5.187.3.57" : "localhost";
app.listen(PORT, '0.0.0.0', () => {
  // console.log(`FileStorage сервер запущен: http://5.187.3.57:${PORT}`);
  console.log(`FileStorage сервер запущен: http://${HOST}:${PORT}`);
});
