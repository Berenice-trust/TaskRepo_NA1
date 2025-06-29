// Нагрузочное тестирование для сервера на К6


import http from 'k6/http';
import { sleep } from 'k6';

// Используем переменную окружения BASE_URL, иначе localhost:3007
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3007/';
//запуск локально k6 run --vus 10 --duration 10s load-test.js
//запуск на сервере BASE_URL=http://5.187.3.57/ k6 run --vus 10 --duration 10s load-test.js

export default function () {
//   http.get('http://localhost:3007/');
//   http.get('http://5.187.3.57/');
   http.get(BASE_URL);
  sleep(1);
}