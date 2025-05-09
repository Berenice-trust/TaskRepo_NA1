// асинхронный тест для проверки работы эндпоинта /proxy

const fetch = require('node-fetch');

describe('/proxy endpoint', () => {
  
    // Асинхронный тест для прокси-запроса к несуществующему URL
    test('should return 404 when request not existing', async () => {
        // URL, который гарантированно вернет 404
        const nonExistentUrl = 'https://api.github.com/not-exist-resource';

        // Отправляем запрос к прокси-серверу
        const response = await fetch('http://localhost:3003/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                method: 'GET',
                url: nonExistentUrl,
                headers: {}
            })
        });
        const data = await response.json(); //тело ответа

        //              server.js
        // const proxyResponse = {
        //     status: response.status,
        //     statusText: response.statusText,
        //     headers: response.headers.raw(),
        //     body: responseBody
        //   }

        // Проверяем, что статус ответа 404
          // Проверяем, что наш прокси-сервер успешно обработал запрос
          expect(response.status).toBe(200);
        
          // Проверяем, что статус от GitHub API был 404
          expect(data.status).toBe(404);
          
          // парсим тело ответа, которое вернул GitHub API в виде строки JSON
          const parsedBody = JSON.parse(data.body);

           // Проверяем содержимое тела ответа от GitHub
        expect(parsedBody).toHaveProperty('message', 'Not Found');
        expect(parsedBody).toHaveProperty('documentation_url');
  

    }, 10000); // на всякий уыеличиваем до 10 секунд (по умолчанию 5)
    
  });