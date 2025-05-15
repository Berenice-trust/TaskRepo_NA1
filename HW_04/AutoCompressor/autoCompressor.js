const fs = require('fs').promises; // буду использовать только промисы
const path = require('path');
const zlib = require('zlib');// библиотека для сжатия
const { promisify } = require('util'); // функция, чтобы промифицировать колбек
const { pipeline } = require('stream'); // функция для работы с потоками
const { createReadStream, createWriteStream } = require('fs'); // функции для создания потоков

// промисифицируем pipeline в версию с Promises
const pipelinePromise = promisify(pipeline);

// из аргументов командной строки получаем путь к директории
//const directoryPath = process.argv[2];

// Проверяем, был ли передан путь к директории
// if (!directoryPath) {
//   console.error('Пожалуйста, укажите путь к директории');
//   console.log('Формат: node autoCompressor.js <путь_к_директории>');
//   process.exit(1);
// }

/**
 * проверяет есть ли аргумент с путем к директории
 * @returns {string} возвращаем путь к директории
 */
function validateCommandLineArgs() {
  const dirPath = process.argv[2];
  if (!dirPath) {
    console.error('Пожалуйста, укажите путь к директории');
    console.log('Формат: node autoCompressor.js <путь_к_директории>');
    process.exit(1);
  }
  return dirPath;
}

// Получаем и проверяем аргументы командной строки
const directoryPath = validateCommandLineArgs(); //dirPath, то есть process.argv[2]


                             // валидация
/**     формату JSDoc
 * Проверяет валидность пути к директории
 * @param {string} dirPath - что передаем в функцию
 * @returns {Promise<void>} - что возвращаем
 * @throws {Error} - ошибка
 */
async function validateDirectory(dirPath) {
  try {
    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) {
      throw new Error(`"${dirPath}" не является директорией`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Директория "${dirPath}" не существует`);
    } 
    throw error;
  }
}

// Основная функция программы
async function autoCompress(dirPath) {
  try {
    // Проверяем валидность директории
    await validateDirectory(dirPath);
    
    console.log(`Начинаем сканирование директории: ${dirPath}`);


    // Здесь будет основная логика программы



    console.log('Сканирование завершено');
  } catch (error) {
    console.error(`Ошибка: ${error.message}`);
    process.exit(1);
  }
}









// Запуск программы
autoCompress(directoryPath);