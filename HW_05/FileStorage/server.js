const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3005;

app.use(express.static('client'));


// Файл для хранения комментариев и данных
const METADATA_FILE = 'files-metadata.json';

// Функция для чтения метаданных
function readMetadata() {
    try {
        if (fs.existsSync(METADATA_FILE)) {
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
    dest: 'uploads/'  // ← сюда сохраняем файлы
});


// Загрузка файла
app.post('/api/upload', upload.single('file'), (req, res) => {
     console.log('Получили файл:', req.file);
    console.log('Оригинальное имя (raw):', req.file.originalname);
    console.log('Комментарий:', req.body.comment);
    
    let originalName;
    try {
        // Пробуем исправить кодировку
        originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
        console.log('Исправленное имя:', originalName);
    } catch (error) {
        console.log('Не удалось исправить кодировку, используем как есть');
        originalName = req.file.originalname;
    }







    // Сохраняем метаданные
    const metadata = readMetadata();
    metadata[req.file.filename] = {
        originalName: originalName,  
        comment: req.body.comment || '',
        uploadDate: new Date().toISOString(),
        size: req.file.size
    };
    saveMetadata(metadata);
    
     res.json({
        success: true,
        message: 'Файл загружен!',
        filename: req.file.filename,
        comment: req.body.comment || '',
        originalName: originalName  
    });
});

// API для списка файлов
app.get('/api/files', (req, res) => {
    try {
        const metadata = readMetadata();
        
        const files = fs.readdirSync('uploads/')
            .filter(filename => filename !== '.gitkeep')
            .map(filename => {
                const filePath = path.join('uploads', filename);
                const stats = fs.statSync(filePath);
                const meta = metadata[filename] || {};
                
                return {
                    id: filename,
                    name: meta.originalName || filename,
                    size: stats.size,
                    uploadDate: meta.uploadDate || stats.birthtime.toISOString(),
                    comment: meta.comment || ''
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


app.get('/api/download/:fileId', (req, res) => {
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
        
        // Получаем оригинальное имя из метаданных
        const metadata = readMetadata();
        const meta = metadata[fileId] || {};
        const originalName = meta.originalName || fileId;

         console.log(`Скачивается файл: ${originalName} (${fileId})`);

       
         // Устанавливаем заголовки
        const encodedName = encodeURIComponent(originalName);
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedName}`);
        res.setHeader('Content-Type', 'application/octet-stream');
        
        
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





const isProduction = process.platform === 'linux'; 
const HOST = isProduction ? '5.187.3.57' : 'localhost';

// Запуск 
app.listen(PORT, () => {
    // console.log(`FileStorage сервер запущен: http://5.187.3.57:${PORT}`);
    console.log(`FileStorage сервер запущен: http://${HOST}:${PORT}`);
});