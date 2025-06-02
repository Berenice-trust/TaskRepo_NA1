const WS_PORT = 3006; // Порт для WebSocket сервера
let ws; // объект соединения WebSocket
let clientId; // ID клиента, который мы получим от сервера
let originalClientId; // ID для отслеживания загрузки при разрыве соединения
let uploadInProgress = false; // флаг активной загрузки
let currentUploadFile = null; // статус загрузки

// Функция для подключения к WebSocket серверу
function connectWebSocket() {
  if (
    ws &&
    ws.readyState !== WebSocket.CLOSED &&
    ws.readyState !== WebSocket.CLOSING
  ) {
    console.log("Соединение уже существует, не создаем новое");
    return;
  }
  // Настраиваем URL для подключения к WebSocket (порт 3006)
  const wsUrl = `ws://${window.location.hostname}:${WS_PORT}`;
  console.log("Подключение к WebSocket:", wsUrl);

  // Создаем объект WebSocket
  ws = new WebSocket(wsUrl);

  // Обрабатываем успешное соединение
  ws.addEventListener("open", () => {
    console.log("WebSocket соединение установлено");
    //showMessage('Соединение с сервером установлено');
  });

  // Обрабатываем получение сообщений от сервера
  ws.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);

      // Обрабатываем разные типы сообщений
      if (data.type === "connection") {
        // Сохраняем ID клиента, полученный от сервера
        clientId = data.clientId;
        console.log("Получен clientId:", clientId);

        // После получения нового ID, отправляем сообщение о связи
        if (currentUploadFile && currentUploadFile.clientId) {
          console.log(
            "Связываем старый ID с новым:",
            currentUploadFile.clientId,
            "->",
            clientId
          );

          // Отправляем сообщение о связи ID
          ws.send(
            JSON.stringify({
              type: "linkIds",
              oldId: currentUploadFile.clientId,
              newId: clientId,
            })
          );

          // Сохраняем originalClientId для продолжения загрузки при разрыве
          originalClientId = currentUploadFile.clientId;
          currentUploadFile = null;
        }
        // Сохраняем в localStorage для восстановления при обновлении страницы
        localStorage.setItem("wsClientId", clientId);
      } else if (data.type === "uploadProgress") {
        // Обновляем прогресс-бар при получении информации о прогрессе
        updateProgressBar(data.percent, data.filename);
      }
    } catch (error) {
      console.error("Ошибка обработки сообщения:", error);
    }
  });

  // Обработчик закрытия соединения
  ws.addEventListener("close", () => {
    console.log("WebSocket соединение закрыто");
    //showMessage('Соединение с сервером потеряно. Пробуем переподключиться...', true);

    // Если загрузка была в процессе, сохраняем originalClientId
    if (uploadInProgress) {
      currentUploadFile = {
        clientId: originalClientId, // Сохраняем оригинальный ID
      };
      console.log("Загрузка была прервана, сохраняем ID:", originalClientId);
    }

    // Пробуем переподключиться через 3 секунды
    setTimeout(connectWebSocket, 3000);
  });

  // Обработчик ошибок
  ws.addEventListener("error", (error) => {
    console.error("WebSocket ошибка:", error);
    //showMessage('Ошибка WebSocket соединения', true);

    // Добавляем проверку состояния сети
    if (navigator.onLine) {
      console.log("Браузер считает, что есть подключение к сети");
    } else {
      console.log("Браузер считает, что нет подключения к сети");
    }
  });
}

// Функция для обновления прогресс-бара
function updateProgressBar(percent, filename) {
  // Проверяем, что загрузка в процессе
  if (!uploadInProgress) {
    return;
  }

  const progressContainer = document.getElementById("progressContainer");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");

  // Проверяем, что элементы найдены
  if (!progressContainer || !progressBar || !progressText) {
    console.error("Элементы прогресс-бара не найдены в DOM");
    return;
  }

  // Показываем прогресс-бар
  progressContainer.style.display = "block";

  // Обновляем прогресс
  progressBar.style.width = percent + "%";
  progressText.textContent = `${percent}% - ${filename}`;

  // Если загрузка завершена
  if (percent >= 100) {
    // Скрываем прогресс-бар через 2 секунды
    setTimeout(() => {
      progressContainer.style.display = "none";
      uploadInProgress = false;
    }, 2000);
  }
}

// функция для показа уведомлений
function showMessage(message, isError = false) {
  const notificationArea = document.getElementById("notification-area");

  // Если элемент еще не доступен, просто выводим в консоль
  if (!notificationArea) {
    console.log(`${isError ? "Ошибка" : "Сообщение"}: ${message}`);
    return;
  }

  const notification = document.createElement("div");
  notification.className = isError ? "message error" : "message success";
  notification.textContent = message;

  notificationArea.prepend(notification);

  // Автоматически удаляем через 5 секунд
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

document.addEventListener("DOMContentLoaded", function () {
  // console.log('Страница загружена!');

  const form = document.getElementById("uploadForm");

  // Подключаемся к WebSocket серверу
  connectWebSocket();

  loadFilesList();

  // загрузка списка файлов с сервера
  async function loadFilesList() {
    console.log("Загружаем список файлов...");

    const response = await fetch("/api/files");
    const result = await response.json();

    console.log("Список файлов с сервера:", result);

    if (result.success) {
      displayFiles(result.files);
    }
  }

  // отображение списка файлов
  function displayFiles(files) {
    const filesList = document.getElementById("filesList");
    const template = document.getElementById("fileItemTemplate");

    if (files.length === 0) {
      filesList.innerHTML = "<p>Пока нет загруженных файлов</p>";
      return;
    }
    filesList.innerHTML = "";

    files.forEach((file) => {
      const fileItem = template.content.cloneNode(true);

      // Заполняем новую структуру
      fileItem.querySelector(".file-name").textContent = `📁 ${file.name}`;
      fileItem.querySelector(
        ".file-size"
      ).textContent = `💾 Размер: ${Math.round(file.size / 1024)} KB`;
      fileItem.querySelector(".file-date").textContent = `📅 ${new Date(
        file.uploadDate
      ).toLocaleString("ru-RU")}`;

      const comment = file.comment || "Без комментария";
      fileItem.querySelector(".file-comment").textContent = `💬 ${comment}`;

      fileItem.querySelector(".download-btn").addEventListener("click", () => {
        downloadFile(file.id);
      });

      fileItem.querySelector(".delete-btn").addEventListener("click", () => {
        deleteFile(file.id, file.name);
      });

      filesList.appendChild(fileItem);
    });
  }

  // Функция удаления файла
  async function deleteFile(fileId, fileName) {
    if (!confirm(`Удалить файл "${fileName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        showMessage(`Файл "${result.deletedFile}" удалён!`);
        // Обновляем список файлов
        loadFilesList();
      } else {
        showMessage("Ошибка: " + result.error);
      }
    } catch (error) {
      console.error("Ошибка удаления:", error);
      showMessage("Ошибка удаления файла");
    }
  }

  // Функция скачивания файла
  window.downloadFile = function (fileId) {
    console.log("Скачиваем файл:", fileId);

    // Открываем ссылку для скачивания
    window.open("/api/download/" + fileId, "_blank");
  };

  // Обработчик отправки формы
  form.addEventListener("submit", async function (e) {
    e.preventDefault(); // Останавливаем обычную отправку
    // console.log('Форма отправлена!');

    const fileInput = document.getElementById("fileInput");
    const commentInput = document.getElementById("commentInput");

    // Получаем выбранный файл
    const file = fileInput.files[0];
    const comment = commentInput.value;

    // console.log('Выбранный файл:', file);
    // console.log('Комментарий:', comment);

    if (!file) {
      showMessage("Выберите файл!");
      return;
    }

    // Устанавливаем флаг загрузки
    uploadInProgress = true;

    // Показываем начальный прогресс-бар (0%)
    updateProgressBar(0, file.name);

    //  console.log('Отправляем файл:', file.name);

    // Создаём FormData
    const formData = new FormData();
    formData.append("file", file);
    formData.append("comment", comment);

    // Добавляем clientId для связи с WebSocket соединением
    if (clientId) {
      formData.append("clientId", clientId);
      console.log("Добавлен clientId:", clientId);
    }

    originalClientId = clientId;

    try {
      // Отправляем на сервер используя originalClientId
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          // Отправляем clientId в заголовках
          // Используем originalClientId вместо clientId
          "X-Client-ID": originalClientId || clientId || "unknown",
        },
        body: formData,
      });

      // Получаем ответ от сервера
      const result = await response.json();
      console.log("Ответ сервера:", result);

      if (result.success) {
        showMessage("Файл загружен! ID: " + result.filename);

        // Очищаем форму
        fileInput.value = "";
        commentInput.value = "";

        loadFilesList();
      } else {
        showMessage("Ошибка: " + result.message);
      }
    } catch (error) {
      console.error("Ошибка отправки:", error);
      showMessage("Ошибка соединения с сервером", true);
      uploadInProgress = false; // Сбрасываем флаг загрузки
    }
  });
});
