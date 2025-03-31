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

// Запускаем сервер
app.listen(PORT, () => {
    console.log(`Server is running on http://5.187.3.57:${PORT}`);
});

