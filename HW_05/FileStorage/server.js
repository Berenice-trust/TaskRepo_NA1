const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const progress = require('progress-stream'); 

const app = express();
const PORT = 3005;

app.use(express.static('client'));


// Файл для хранения комментариев и данных
const METADATA_FILE = 'files-metadata.json';

// Функция для чтения метаданных
function readMetadata() {
    try {
        if (fs.existsSync(METADATA_FILE)) { // Проверяем существует ли файл
            const data = fs.readFileSync(METADATA_FILE, 'utf8');
            return JSON.parse(data);
        }
        return {};
    } catch (error) {
        console.error('Ошибка чтения метаданных:', error);
        return {};
    }
}

// Функция для сохранения метаданных
function saveMetadata(metadata) {
    try {
        fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
    } catch (error) {
        console.error('Ошибка сохранения метаданных:', error);
    }
}

// Настройка Multer 
const upload = multer({
    dest: 'uploads/'  // ← сюда сохраняем
});


// API Загрузка файла
app.post('/api/upload', (req, res) => {
    console.log('Начинаем загрузку файла...');
    

     // создаем отслеживание прогресса
    let lastSentPercent = 0; //для отслеживания последнего отправленного процента, чтобы не отправлять слишком часто
    const fileProgress = progress();
    const totalSize = +req.headers['content-length'];
    
    console.log(`Общий размер запроса: ${totalSize} байт`);
    
    // Перенаправляем данные через progress-stream
    req.pipe(fileProgress);
    fileProgress.headers = req.headers; // копируем заголовки запроса
    
    // подписываемся на событие прогресса (у каждого пользователя будет свой прогресс)
    fileProgress.on('progress', (progressData) => {
        const percent = Math.round((progressData.transferred / totalSize) * 100); 
        console.log(`Загружено: ${percent}% (${progressData.transferred}/${totalSize} байт)`);

        // чтобы реже отправлять прогресс (только когда процент меняется или на определенных этапах)
    // if (percent !== lastSentPercent || percent === 100 || 
    //     percent === 1 || percent % 10 === 0) {
    //     lastSentPercent = percent;  
    //    
    //     }

    });

    // multer для сохранения файла, программный вызов, поскольку мы используем progress-stream
    // возвращает midleвар для обработки прогресса 
    const singleFileMiddleware = upload.single('file'); //'file' - это имя поля в форме
    // fileProgress, res, callback(c информацией о файле) - передаем модифицированный поток и ответ
    singleFileMiddleware(fileProgress, res, (err) => {
        if (err) {
            console.error('Ошибка загрузки:', err);
            return res.status(500).json({ success: false, error: 'Ошибка загрузки файла' });
        }
    
   
        let originalName;
        try {
            // для русских символов
            originalName = Buffer.from(fileProgress.file.originalname, 'latin1').toString('utf8');
            console.log('Исправленное имя:', originalName);
        } catch (error) {
            console.log('Не удалось исправить кодировку, используем как есть');
            originalName = fileProgress.file.originalname;
        }

        // Сохраняем метаданные
        const metadata = readMetadata();
        metadata[fileProgress.file.filename] = {
            originalName: originalName,  
            comment: fileProgress.body.comment || '',
            uploadDate: new Date().toISOString(),
            size: fileProgress.file.size
        };
        saveMetadata(metadata);
        
        // отправляем ответ клиенту
        res.json({
            success: true,
            message: 'Файл загружен!',
            filename: fileProgress.file.filename,
            comment: fileProgress.body.comment || '',
            originalName: originalName  
        });
    });

});


// API для списка файлов
app.get('/api/files', (req, res) => {
    try {
        const metadata = readMetadata();
        
        const files = fs.readdirSync('uploads/') // читаем файлы в папке uploads
            .filter(filename => filename !== '.gitkeep') // исключаем служебный файл .gitkeep
            .map(filename => {
                const filePath = path.join('uploads', filename);
                const stats = fs.statSync(filePath); // получаем информацию о файле
                const meta = metadata[filename] || {};
                
                return {
                    id: filename,
                    name: meta.originalName || filename,
                    size: stats.size,
                    uploadDate: meta.uploadDate || stats.birthtime.toISOString(),
                    comment: meta.comment || ''
                };
            });

            // ответ
        res.json({ 
            success: true, 
            files: files 
        });

    } catch (error) {
        console.error('Ошибка чтения файлов:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка получения списка файлов' 
        });
    }
});


// API для скачивания файла
app.get('/api/download/:fileId', (req, res) => {
    try {
        const fileId = req.params.fileId; // Получаем ID файла из параметров запроса
        const filePath = path.join('uploads', fileId);
        
        // Проверяем что файл существует
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ 
                success: false, 
                error: 'Файл не найден' 
            });
        }
        
        // Получаем оригинальное имя из метаданных
        const metadata = readMetadata();
        const meta = metadata[fileId] || {};
        const originalName = meta.originalName || fileId;

        console.log(`Скачивается файл: ${originalName} (${fileId})`);

       
         // Устанавливаем заголовки
        const encodedName = encodeURIComponent(originalName);
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedName}`); // Указываем браузеру скачать
        res.setHeader('Content-Type', 'application/octet-stream'); // универсальный тип данных
        
        
        // Отправляем файл
        res.sendFile(path.resolve(filePath));
        
    } catch (error) {
        console.error('Ошибка скачивания:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка скачивания файла' 
        });
    }
});


// API для удаления файла
app.delete('/api/files/:fileId', (req, res) => {
    try {
        const fileId = req.params.fileId;
        const filePath = path.join('uploads', fileId);
        
        // Проверяем что файл существует
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ 
                success: false, 
                error: 'Файл не найден' 
            });
        }
        
        // Получаем метаданные
        const metadata = readMetadata();
        const meta = metadata[fileId] || {};
        const originalName = meta.originalName || fileId;
        
        // Удаляем файл с диска
        fs.unlinkSync(filePath);
        
        // Удаляем метаданные
        delete metadata[fileId];
        saveMetadata(metadata);
        
        console.log(`Удалён файл: ${originalName} (${fileId})`);
        
        res.json({
            success: true,
            message: `Файл "${originalName}" удалён`,
            deletedFile: originalName
        });
        
    } catch (error) {
        console.error('Ошибка удаления:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка удаления файла' 
        });
    }
});




// чтобы на сервете показал правильный адрес
const isProduction = process.platform === 'linux'; 
const HOST = isProduction ? '5.187.3.57' : 'localhost';

// Запуск 
app.listen(PORT, () => {
    // console.log(`FileStorage сервер запущен: http://5.187.3.57:${PORT}`);
    console.log(`FileStorage сервер запущен: http://${HOST}:${PORT}`);
});