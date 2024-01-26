const express = require('express');
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

// Маршрут для получения данных из текстовых полей
app.post('/submit-text', (req, res) => {
    console.log('Полученные тексты:', req.body.inputs); // Здесь вы можете обработать данные
    res.json({ status: 'success', message: 'Тексты получены' });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
