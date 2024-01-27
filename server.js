const express = require('express');
const { spawn } = require('child_process');
const app = express();
const port = 3001;
const path = require('path');
const cors = require('cors');
const pg = require('pg');


app.use(cors()); // Это позволяет запросы со всех источников
app.use(express.json());
app.use(express.static('public')); // Статическая папка для хранения изображений

const dbConfig = {
    user: 'myuser', // ваше имя пользователя для базы данных
    host: 'localhost',
    database: 'nadsignsdb', // имя вашей базы данных
    password: 'nashslon', // ваш пароль
    port: 5432, // порт, на котором работает ваш сервер PostgreSQL
};

const client = new pg.Client(dbConfig);
client.connect();

const createTableText = `
    CREATE TABLE IF NOT EXISTS signatures_processed (
        id SERIAL PRIMARY KEY,
        fullname TEXT,
        birth_year TEXT,
        address TEXT,
        passport_number TEXT,
        signature_date TEXT,
        fullname_unclear BOOLEAN DEFAULT FALSE,
        birth_year_unclear BOOLEAN DEFAULT FALSE,
        address_unclear BOOLEAN DEFAULT FALSE,
        passport_number_unclear BOOLEAN DEFAULT FALSE,
        signature_date_unclear BOOLEAN DEFAULT FALSE,
        comment TEXT,
        cancelled BOOLEAN DEFAULT FALSE
    );
`;

client.query(createTableText)
    .then(res => console.log("Таблица 'signatures_processed' успешно создана или уже существует"))
    .catch(err => console.error(err))
    .finally(() => client.end());

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

// Маршрут для вызова Python скрипта
app.get('/get-signature-data', (req, res) => {
    process.chdir(path.join(__dirname, '../nadezhdinSigns/'));

    res.setHeader('Content-Type', 'application/json; charset=utf-8');


    // Запуск Python скрипта (замените 'python' на 'python3' в зависимости от вашего окружения)
    const pythonProcess = spawn('./venv/Scripts/python.exe', ['../nadezhdinSigns/signature_request.py']); // Укажите здесь путь к вашему Python-скрипту

    let dataString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stdout.on('end', () => {
        //console.log(dataString); // Это выведет в консоль всю строку, которая была собрана из stdout Python-скрипта

        // Попытка разобрать JSON-ответ
        try {
            const data = JSON.parse(dataString);
            res.json(data);
        } catch (e) {
            console.error('Ошибка при разборе JSON:', e);
            res.status(500).send('Ошибка на сервере');
        }
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Ошибка: ${data}`);
    });
});


app.post('/update-signature', async (req, res) => {
    console.log('Полученный JSON:', req.body); // Выводим в консоль входящий JSON

    const {
        id,
        fullname,
        birth_year,
        address,
        passport_number,
        signature_date,
        errors,
        comment,
        cancelled
    } = req.body;

    try {
        // Подключение к базе данных
        const client = new pg.Client(dbConfig);
        await client.connect();

        // Добавляем данные об ошибках в массив queryValues
        const queryValues = [
            id,
            fullname,
            birth_year,
            address,
            passport_number,
            signature_date,
            errors[0], // fullname_unclear
            errors[1], // birth_year_unclear
            errors[2], // address_unclear
            errors[3], // passport_number_unclear
            errors[4], // signature_date_unclear
            comment,
            cancelled
        ];

        // Обновляем текст SQL-запроса
        const insertQueryText = `
            INSERT INTO signatures_processed (
                id, 
                fullname, 
                birth_year, 
                address, 
                passport_number, 
                signature_date, 
                fullname_unclear, 
                birth_year_unclear, 
                address_unclear, 
                passport_number_unclear, 
                signature_date_unclear, 
                comment,
                cancelled
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (id) DO NOTHING;
        `;

        // Выполнение запроса
        await client.query(insertQueryText, queryValues);

        // Закрытие соединения с базой данных
        await client.end();

        res.json({ status: 'success', message: 'Данные успешно добавлены' });
    } catch (err) {
        console.error('Ошибка при добавлении данных:', err);
        res.status(500).json({ status: 'error', message: 'Ошибка на сервере' });
    }
});


// В вашем server.js
/*
app.post('/update-signature', async (req, res) => {
    console.log('Полученный JSON:', req.body); // Выводим в консоль входящий JSON

    const { id, fullname, birth_year, address, passport_number, signature_date } = req.body;

    // Здесь должна быть логика проверки валидности полученных данных перед обновлением в БД

    try {
        // Подключение к базе данных (если вы еще не подключены)
        const client = new pg.Client(dbConfig);
        await client.connect();

        const insertQueryText = `
            INSERT INTO signatures_processed (id, fullname, birth_year, address, passport_number, signature_date)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO NOTHING;
        `;

        const queryValues = [id, fullname, birth_year, address, passport_number, signature_date];

        await client.query(insertQueryText, queryValues);

        await client.end();

        res.json({ status: 'success', message: 'Данные успешно добавлены' });
    } catch (err) {
        console.error('Ошибка при обновлении подписи:', err);
        res.status(500).json({ status: 'error', message: 'Ошибка на сервере' });
    }
});

 */

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
