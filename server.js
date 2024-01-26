const express = require('express');
const { spawn } = require('child_process');
const app = express();
const port = 3001;
const path = require('path');
const cors = require('cors');

app.use(cors()); // Это позволяет запросы со всех источников
app.use(express.json());
app.use(express.static('public')); // Статическая папка для хранения изображений



// Создаем маршруты для каждого изображения
for (let i = 1; i <= 6; i++) {
    app.get(`/get-image${i}`, (req, res) => {
        res.sendFile(path.join(__dirname, `/public/picture${i}.png`));
    });
}

app.get('/default-values', (req, res) => {
    res.json({
        inputs: [
            "Иванов Иван Иванович",
            "1990",
            "Тульская область, г. Тула, ул. Самоварная, д. 1, кв. 2",
            "7002 123456",
            "01.01.2024"
        ]
    });
});


// Маршрут для получения данных из текстовых полей
app.post('/submit-text', (req, res) => {
    console.log('Полученные тексты:', req.body.inputs); // Здесь вы можете обработать данные
    res.json({ status: 'success', message: 'Тексты получены' });
});

// Маршрут для получения данных от Python скрипта
app.get('/get-data', (req, res) => {
    // Запуск Python скрипта
    const pythonProcess = spawn('python', ['script.py']);

    pythonProcess.stdout.on('data', (data) => {
        // Парсинг данных, отправленных из Python скрипта
        const pythonData = JSON.parse(data.toString());
        res.json(pythonData);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
        res.status(500).send(data.toString());
    });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
