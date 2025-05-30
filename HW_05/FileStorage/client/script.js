document.addEventListener('DOMContentLoaded', function() {
    // console.log('Страница загружена!');

    const form = document.getElementById('uploadForm');


    loadFilesList(); 

    // загрузка списка файлов с сервера
    async function loadFilesList() {
        console.log('Загружаем список файлов...');
            
        const response = await fetch('/api/files');
        const result = await response.json();
            
        console.log('Список файлов с сервера:', result);

        if (result.success) {
            displayFiles(result.files);
        }
    }


    // отображение списка файлов
    function displayFiles(files) {
        const filesList = document.getElementById('filesList');
         const template = document.getElementById('fileItemTemplate');
    
        
        if (files.length === 0) {
            filesList.innerHTML = '<p>Пока нет загруженных файлов</p>';
            return;
        }
         filesList.innerHTML = '';
    
        files.forEach(file => {
            const fileItem = template.content.cloneNode(true);
            
            // Заполняем новую структуру
            fileItem.querySelector('.file-name').textContent = `📁 ${file.name}`;
            fileItem.querySelector('.file-size').textContent = `💾 Размер: ${Math.round(file.size / 1024)} KB`;
            fileItem.querySelector('.file-date').textContent = `📅 ${new Date(file.uploadDate).toLocaleString('ru-RU')}`;
            
            const comment = file.comment || 'Без комментария';
            fileItem.querySelector('.file-comment').textContent = `💬 ${comment}`;


            fileItem.querySelector('.download-btn').addEventListener('click', () => {
                downloadFile(file.id);
            });

             fileItem.querySelector('.delete-btn').addEventListener('click', () => {
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
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                showMessage(`Файл "${result.deletedFile}" удалён!`);
                // Обновляем список файлов
                loadFilesList();
            } else {
                showMessage('Ошибка: ' + result.error);
            }
            
        } catch (error) {
            console.error('Ошибка удаления:', error);
            showMessage('Ошибка удаления файла');
        }
    }

    // Функция скачивания файла
   window.downloadFile = function(fileId) {
        console.log('Скачиваем файл:', fileId);
        
        // Открываем ссылку для скачивания
        window.open('/api/download/' + fileId, '_blank');
    };

    // функция для показа уведомлений
    function showMessage(message, isError = false) {
        const notificationArea = document.getElementById('notification-area');
        
        const notification = document.createElement('div');
        notification.className = isError ? 'message error' : 'message success';
        notification.textContent = message;
        
        notificationArea.prepend(notification);
        
        // Автоматически удаляем через 5 секунд
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }


    // Обработчик отправки формы
    form.addEventListener('submit', async function(e) {
        e.preventDefault(); // Останавливаем обычную отправку
        console.log('Форма отправлена!');
        
        // Получаем элементы формы
        const fileInput = document.getElementById('fileInput');
        const commentInput = document.getElementById('commentInput');
        
        // Получаем выбранный файл
        const file = fileInput.files[0];
        const comment = commentInput.value;
        
        console.log('Выбранный файл:', file);
        console.log('Комментарий:', comment);
        
        if (!file) {
            showMessage('Выберите файл!');
            return;
        }
        
         console.log('Отправляем файл:', file.name);


         // Создаём FormData 
        const formData = new FormData();
        formData.append('file', file);
        formData.append('comment', comment);
        
        try {
            // Отправляем на сервер
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            // Получаем ответ от сервера
            const result = await response.json();
            console.log('Ответ сервера:', result);
            
            if (result.success) {
                showMessage('Файл загружен! ID: ' + result.filename);
                
                // Очищаем форму
                fileInput.value = '';
                commentInput.value = '';

                loadFilesList();
            } else {
                showMessage('Ошибка: ' + result.message);
            }
            
        } catch (error) {
            console.error('Ошибка отправки:', error);
            showMessage('Ошибка соединения с сервером');
        }



    });
});