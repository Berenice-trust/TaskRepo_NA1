const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000; //или переменная окружения, или 3000

app.use(express.json()); //обработка json

app.use(express.static(path.join(__dirname, 'public'))); //где статически файлы, фронтенд

const dataFilePath = path.join(__dirname, 'votes.json'); //данные с голосами

//для чтения из файла
function readDataFile() {
    return JSON.parse(fs.readFileSync(dataFilePath));
}

//для записи в файл
function writeDataFile(data) {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

// Создаем файл, если его нет
if (!fs.existsSync(dataFilePath)) {
  const initialData = {
    variants: [
        { id: 1, text: 'Коты' },
        { id: 2, text: 'Собаки'},
        { id: 3, text: 'Чубакка'},
        ],
    votes: {
        "1" : 0, 
        "2" : 0,
        "3" : 0,
    }
  };
    // Записываем в файл
//fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
    writeDataFile(initialData);
}

// GET /variants - варианты ответов
app.get('/variants', (req, res) => {
    const data = readDataFile();
    res.json(data.variants);
});

// POST /vote - принимает голос
app.post('/vote', (req, res) => {
    const { id } = req.body; //id варианта ответа

    //есть ли id?
    if (!id) {
        return res.status(400).json({ error: 'No id specified' }); 
    }

    const data = readDataFile();

    //есть ли вариант ответа с id?
    if (!data.votes.hasOwnProperty(id)) {
        return res.status(400).json({ error: 'Invalid id' });
    }

    data.votes[id]++; //увеличиваем количество голосов

    //сохраняем изменения
    writeDataFile(data);
    res.json({success: true})


});

// POST /stat - статистика
app.post('/stat', (req, res) => {
    const data = readDataFile();
    res.json(data.votes);
});

// GET / - главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/download', (req, res) => {
    //читаем файл
    const data = readDataFile();
    const acceptHeader = req.headers.accept || '';

    //отключаем кэширование
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    //получаем имена вариантов
    const variantNames = {};
    data.variants.forEach(variant => {
        variantNames[variant.id] = variant.text;
    });

    if (acceptHeader.includes('text/html')) {
        //если html
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Результаты</title>
            </head>
            <body>
                <h1>Результаты голосования</h1>
                <table>
                    <tr>
                        <th>Вариант</th>
                        <th>Количество голосов</th>
                    </tr>`;
                    
        Object.keys(data.votes).forEach(id => {
            html += `
                <tr>
                    <td>${variantNames[id] || `Вариант ${id}`}</td>
                    <td>${data.votes[id]}</td>
                </tr>`;
        });
                    
            html += `
                    </table>
                </body>
                </html>`;
                    
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', 'attachment; filename=results.html');
        res.send(html);

    } else if (acceptHeader.includes('application/xml') || acceptHeader.includes('text/xml')) {
        //если xml
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<votes>\n';
            
        Object.keys(data.votes).forEach(id => {
            xml += `  <option id="${id}" name="${variantNames[id] || `Вариант ${id}`}">${data.votes[id]}</option>\n`;
        });
            
        xml += '</votes>';
            
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', 'attachment; filename=voting-results.xml');
        res.send(xml);
    } 

    else {
        // По умолчанию - JSON 
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="votes.json"');
        res.send(JSON.stringify(data.votes, null, 2));
    }
});

// Запускаем сервер
app.listen(PORT, () => {
    console.log(`Server is running on http://5.187.3.57:${PORT}`);
});

