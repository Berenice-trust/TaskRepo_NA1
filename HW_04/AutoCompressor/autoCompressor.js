const fs = require('fs').promises; // буду использовать только промисы
const path = require('path');
const zlib = require('zlib');// библиотека для сжатия
const os = require('os'); // библиотека для работы с операционной системой
const { promisify } = require('util'); // функция, чтобы промифицировать колбек
const { pipeline } = require('stream'); // функция для работы с потоками
const { createReadStream, createWriteStream } = require('fs'); // функции для создания потоков

// промисифицируем pipeline в версию с Promises
const pipelinePromise = promisify(pipeline);

/**
 * проверяет есть ли аргумент с путем к директории и опцией очистки
 * @returns {{dirPath: string, shouldClear: boolean}} директория и флаг очистки
 */
function readCommandLineArgs() {
  //const dirPath = process.argv[2];
   // есть ли аргумент очистки (--clear или --clean)
  const shouldClear = process.argv.includes('--clear') || process.argv.includes('--clean');
  
  // Находим аргумент с путем (первый аргумент, который не является опцией) можно двигать местами
  const dirPath = process.argv.find(arg => !arg.startsWith('--') && 
                                           !arg.includes('node') && 
                                           !arg.includes('autoCompressor'));
  




  if (!dirPath) {
    console.error('Пожалуйста, укажите путь к директории');
    console.log('Формат: node autoCompressor.js <путь_к_директории>');
    process.exit(1);
  }
  //return dirPath;
  return { dirPath, shouldClear };
}

// Получаем и проверяем аргументы командной строки
//const directoryPath = validateCommandLineArgs(); //dirPath, то есть process.argv[2]
const { dirPath: directoryPath, shouldClear } = readCommandLineArgs();

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
    if (error.code === 'ENOENT') { // ошибка, если директория не существует
      throw new Error(`Директория "${dirPath}" не существует`);
    } 
    throw error;
  }
}

                    // Ищем все файлы в директории и поддиректориях
/**
 * @param {string} dir - путь к директории
 * @returns {Promise<string[]>} - массив путей к файлам (в том формате, что и входные)
 */
async function getAllFiles(dir) {
  let files = [];
  
  // Получаем содержимое директории, первый уровень вложения
  console.log(`Сканирование директории: ${dir}`);
  const entries = await fs.readdir(dir, { withFileTypes: true }); // названия файлов и папок с информацией
  
 // Подсчитываем только оригинальные файлы (не .gz и не директории)
  const originalFiles = entries.filter(entry => 
    !entry.isDirectory() && !entry.name.endsWith('.gz')
  );
  // Выводим информацию с правильным склонением
console.log(`Найдено ${originalFiles.length} оригинальных ${getFilesWord(originalFiles.length)}`);

  
  

  // Обрабатываем каждый элемент
  for (const entry of entries) {
    const ItemPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Если это директория - вызываем рекурсивно
      const subDirFiles = await getAllFiles(ItemPath);
      files = files.concat(subDirFiles); //объединение массивов
    } else {
      files.push(ItemPath);
    }
  }
  
  return files; // массив путей к файлам
}

                                //сжимать или нет
/**
 * Проверяет, нужно ли создавать или обновлять сжатую версию файла
 * @param {string} originalPath - путь к исходному файлу
 * @param {string} gzipPath - путь к сжатой версии
 * @returns {Promise<boolean>} - true, если нужно создать/обновить архив
 */
async function needsCompression(originalPath, gzipPath) {
  try {
    // Получаем информацию об оригинальном файле
    const originalStats = await fs.stat(originalPath);
    
    try {
      // Проверяем существование и дату сжатого файла
      const gzipStats = await fs.stat(gzipPath);
      
      // проверяем время модификации
      return originalStats.mtime > gzipStats.mtime;
    } catch (error) {
      // Если сжатого файла нет - нужно создать
      if (error.code === 'ENOENT') {
        return true;
      }
      throw error; // другие ошибки пробрасываем дальше
    }
  } catch (error) {
        console.error(`Ошибка при проверке файлов: ${error.message}`);
        throw error;
  }
}

/**
 * Создает сжатую версию файла
 * @param {string} sourcePath - путь к исходному файлу
 * @param {string} destPath - путь для сжатой версии
 * @returns {Promise<void>}
 */
async function compressFile(sourcePath, destPath) {
  console.log(`Начинаю сжатие ${sourcePath}`);
  
  try {
    // Создаем потоки для чтения, сжатия и записи
    const readStream = createReadStream(sourcePath);
    const gzipStream = zlib.createGzip();
    const writeStream = createWriteStream(destPath);
    
    // Связываем потоки 
    await pipelinePromise(readStream, gzipStream, writeStream);
    
    console.log(`Сжатие завершено: ${destPath}`);
  } catch (error) {
    console.error(`Ошибка при сжатии ${sourcePath}: ${error.message}`);
    throw error;
  }
}




// Основная функция программы
async function autoCompress(dirPath) {
  console.time('Время сжатия');
  try {
    // Проверяем валидность директории
    await validateDirectory(dirPath);
    
    console.log(`Приступаем к сканированию директории: ${dirPath}`);


      // Получаем список всех файлов (включая .gz)
    const allFiles = await getAllFiles(dirPath);

    // Отдельно подсчитываем количество оригинальных файлов
    const originalFilesCount = allFiles.filter(file => !file.endsWith('.gz')).length;

    console.log(`Всего в папке ${dirPath} и подпапках найдено ${originalFilesCount} оригинальных ${getFilesWord(originalFilesCount)}${os.EOL}`);

    // Последовательно обрабатываем каждый файл
    for (const filePath of allFiles) {
          // Пропускаем файлы, которые уже являются .gz архивами
      if (filePath.endsWith('.gz')) {
        //console.log(`Пропускаем архив: ${filePath}`);
        continue;
      }



      // Путь к архиву - просто добавляем .gz к пути файла
      const gzipPath = filePath + '.gz';
      
        try {
        // Проверяем, нужно ли создавать/обновлять сжатую версию
        const shouldUpdate = await needsCompression(filePath, gzipPath);
            
        if (shouldUpdate) {
        // Создаем или обновляем сжатую версию
        console.log(`Требуется создание/обновление архива: ${gzipPath}`);
        await compressFile(filePath, gzipPath);
        } else {
        console.log(`Архив актуален: ${gzipPath}`);
        }
        } catch (error) {
            console.error(`Ошибка при обработке файла ${filePath}: ${error.message}`);
            // Продолжаем с другими файлами
        }
    }



    console.log(`Сканирование завершено ${os.EOL}`); // os.EOL, хоть должно работать и \n
  } catch (error) {
    console.error(`Ошибка: ${error.message}`);
    process.exit(1);
  }
  console.timeEnd('Время сжатия');
}



/**
 * Удаляет все .gz файлы в указанной директории и поддиректориях
 * @param {string} dirPath - путь к директории
 * @returns {Promise<number>} - количество удаленных файлов
 */
async function clearGzipFiles(dirPath) {
  try {
    // Проверяем валидность директории
    await validateDirectory(dirPath);
    
    console.log(`Начинаем поиск .gz файлов для удаления в директории: ${dirPath}`);
    
    // Получаем все файлы
    const allFiles = await getAllFiles(dirPath);
    
    // Фильтруем только .gz файлы
    const gzFiles = allFiles.filter(file => file.endsWith('.gz'));
    
    console.log(`Найдено ${gzFiles.length} ${getFilesWord(gzFiles.length)} для удаления`);
    
    // Счетчик удаленных файлов
    let deletedCount = 0;
    
    // Удаляем каждый .gz файл
    for (const gzFile of gzFiles) {
      try {
        await fs.unlink(gzFile); // fs.promises.unlink удаляет файл
        console.log(`Удален файл: ${gzFile}`);
        deletedCount++;
      } catch (error) {
        console.error(`Ошибка при удалении файла ${gzFile}: ${error.message}`);
      }
    }
    
    console.log(`Удаление завершено. Удалено ${deletedCount} ${getFilesWord(deletedCount)}${os.EOL}`);
    return deletedCount;
  } catch (error) {
    console.error(`Ошибка при удалении .gz файлов: ${error.message}`);
    process.exit(1);
  }
}


/**
 * Возвращает правильное окончание слова "файл" 
 * @param {number} count - количество файлов
 * @returns {string} - правильное слово
 */
function getFilesWord(count) {
  // Обрабатываем числа от 11 до 19 отдельно - они всегда с "файлов"
  if (count % 100 >= 11 && count % 100 <= 19) {
    return 'файлов';
  }
  
  
  switch (count % 10) {
    case 1: return 'файл';     // 1, 21, 31, ...
    case 2:
    case 3:
    case 4: return 'файла';    // 2-4, 22-24, ...
    default: return 'файлов';  // 0, 5-9, 10, ...
  }
}



                // Запуски

if (shouldClear) {
  // Если указан флаг --clear, удаляем .gz файлы
  clearGzipFiles(directoryPath);
} else {
  // Иначе выполняем обычное сжатие
  autoCompress(directoryPath);
}

// Запуск программы
//autoCompress(directoryPath);