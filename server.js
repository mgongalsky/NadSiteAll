const express = require('express');
const app = express();
const port = 3001;
const path = require('path');

const cors = require('cors');

app.use(cors()); // Это позволяет запросы со всех источников



app.use(express.json());
app.use(express.static('public')); // Статическая папка для хранения изображений

// Маршрут для получения первого изображения
app.get('/get-image1', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/example1.jpg'));
});

// Маршрут для получения второго изображения
app.get('/get-image2', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/example2.jpg'));
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
