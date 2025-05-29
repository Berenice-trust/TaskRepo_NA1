document.addEventListener('DOMContentLoaded', function() {
    // console.log('Страница загружена!');

    const form = document.getElementById('uploadForm');

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
            alert('Выберите файл!');
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
                alert('Файл загружен! ID: ' + result.filename);
                
                // Очищаем форму
                fileInput.value = '';
                commentInput.value = '';
            } else {
                alert('Ошибка: ' + result.message);
            }
            
        } catch (error) {
            console.error('Ошибка отправки:', error);
            alert('Ошибка соединения с сервером');
        }



    });
});