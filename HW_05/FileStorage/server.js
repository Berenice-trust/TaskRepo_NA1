const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3005;

app.use(express.static('client'));


// Настройка Multer 
const upload = multer({
    dest: 'uploads/'  // ← сюда сохраняем файлы
});


// Загрузка файла
app.post('/api/upload', upload.single('file'), (req, res) => {
    console.log('Получили файл:', req.file);
    
    res.json({
        success: true,
        message: 'Файл загружен!',
        filename: req.file.filename
    });
});

// API для списка файлов
app.get('/api/files', (req, res) => {
    try {
        // Читаем папку uploads
        const files = fs.readdirSync('uploads/')
            .filter(filename => filename !== '.gitkeep') // Исключаем служебные файлы
            .map(filename => {
                const filePath = path.join('uploads', filename);
                const stats = fs.statSync(filePath);
                
                return {
                    id: filename,
                    name: filename, // системное имя
                    size: stats.size,
                    uploadDate: stats.birthtime.toISOString()
                };
            });

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

const isProduction = process.platform === 'linux'; 
const HOST = isProduction ? '5.187.3.57' : 'localhost';

// Запуск 
app.listen(PORT, () => {
    // console.log(`FileStorage сервер запущен: http://5.187.3.57:${PORT}`);
    console.log(`FileStorage сервер запущен: http://${HOST}:${PORT}`);
});