import json

# Данные, которые мы хотим отправить обратно в Node.js
data = {
    'images': [
        'picture1.png',
        'picture2.png',
        'picture3.png',
        'picture4.png',
        'picture5.png',
        'picture6.png',
    ],
    'defaultValues': [
        'Петров Петр Петрович',
        '1990',
        'Тульская область, г. Тула, ул. Самоварная, д. 1, кв. 2',
        '7002 123456',
        '01.01.2024',
    ]
}

# Отправка данных обратно в Node.js
print(json.dumps(data))
