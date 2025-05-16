const fs = require('fs').promises; // буду использовать только промисы
const path = require('path');
const zlib = require('zlib');// библиотека для сжатия
const os = require('os'); // библиотека для работы с операционной системой
const { promisify } = require('util'); // функция, чтобы промифицировать колбек
const { pipeline } = require('stream'); // функция для работы с потоками
const { createReadStream, createWriteStream } = require('fs'); // функции для создания потоков
const async = require('async'); // добавляем модуль async
const chalk = require('chalk');


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
  const fileName = path.basename(sourcePath);
  //console.log(`Начинаю сжатие ${sourcePath}`);
  console.log(chalk.yellow(`Начинаю сжатие ${fileName}`));
  
  try {
    // Создаем потоки для чтения, сжатия и записи
    const readStream = createReadStream(sourcePath);
    const gzipStream = zlib.createGzip();
    const writeStream = createWriteStream(destPath);
    
    // Связываем потоки 
    await pipelinePromise(readStream, gzipStream, writeStream);
    
    //console.log(`Сжатие завершено: ${destPath}`);
    console.log(chalk.green(`Сжатие завершено: ${fileName} в ${destPath}`));

  } catch (error) {
    console.error(chalk.red(`Ошибка при сжатии ${sourcePath}: ${error.message}`));
    throw error;
  }
}


                            //Собственно автокомпрессор

/**
 * Основная функция автоматического сжатия файлов.
 * Сканирует указанную директорию и все поддиректории, находит файлы,
 * которые требуют сжатия, и создает или обновляет их .gz версии
 * 
 * @param {string} dirPath - путь к директории для сканирования и сжатия
 * @returns {Promise<void>} - промис, который разрешается после завершения работы
 * @throws {Error} - ошибка при недопустимом пути или проблемах доступа
 */
async function autoCompress(dirPath) {
  console.time('Время сжатия');
  try {
    // Проверяем валидность директории
    await validateDirectory(dirPath);
    
    console.log(`Приступаем к сканированию директории: ${dirPath}`);


      // Получаем список всех файлов (включая .gz)
    const allFiles = await getAllFiles(dirPath);


    // Определяем оптимальное количество параллельных операций
    const parallelCount = getOptimalParallelCount();


    // Отдельно находим оригинальные файлы и их количество
    const originalFiles = allFiles.filter(file => !file.endsWith('.gz'));
    const originalFilesCount = originalFiles.length;

        // Раннее завершение, если нет оригинальных файлов
    if (originalFilesCount === 0) {
      console.log(`В директории ${dirPath} и подпапках не найдено файлов для обработки${os.EOL}`);
      console.log(`Сканирование завершено ${os.EOL}`);
      return;
    }


    console.log(`Всего в папке ${dirPath} и подпапках найдено ${originalFilesCount} оригинальных ${getFilesWord(originalFilesCount)}${os.EOL}`);

      // Собираем информацию о файлах, требующих обработки
      const filesToProcess = [];

      for (const filePath of originalFiles) {
        // Путь к архиву - просто добавляем .gz к пути файла
        const gzipPath = filePath + '.gz';
        
          try {
            // Проверяем, нужно ли создавать/обновлять сжатую версию
            const shouldUpdate = await needsCompression(filePath, gzipPath);
                
            if (shouldUpdate) {
              // Добавляем список файлов для обработки (пока не сжимаем)
              filesToProcess.push({ source: filePath, dest: gzipPath });
              // путь к исходному файлу, который надо сжать, и путь к будущему архиву

            // Создаем или обновляем сжатую версию
            // console.log(`Требуется создание/обновление архива: ${gzipPath}`);
            //await compressFile(filePath, gzipPath);
            } else {
              console.log(`Архив актуален: ${gzipPath}`);
            }
          } catch (error) {
              console.error(`Ошибка при обработке файла ${filePath}: ${error.message}`);
          }
      }
    
        // Если есть что сжимать... Параллельная обработка
    if (filesToProcess.length > 0) {
      console.log(`${os.EOL}Будет обработано ${filesToProcess.length} ${getFilesWord(filesToProcess.length)} (${parallelCount} параллельных ${getStreamsWord(parallelCount)})${os.EOL}`);
      
      // Функция для обработки одного файла
      async function processFile(fileInfo) {
        try {
          await compressFile(fileInfo.source, fileInfo.dest); // путь к исходному файлу и путь к архиву
          return { success: true, path: fileInfo.source, destPath: fileInfo.dest };
        } catch (error) {
          console.error(`Ошибка при обработке файла ${fileInfo.source}: ${error.message}`);
          return { success: false, path: fileInfo.source, error: error.message };
        }
      }
      
      // Обрабатываем файлы параллельно пакетами
      //const results = await processBatches(filesToProcess, processFile, parallelCount);
      // Обрабатываем файлы с умным распределением нагрузки
      const results = await smartParallelProcessing(filesToProcess, processFile, parallelCount);
      
      // Подсчитываем статистику
      const successCount = results.filter(r => r.success).length;
      
      console.log(`${os.EOL}Обработка завершена. Успешно: ${successCount} из ${filesToProcess.length}`);
    } else {
      console.log(`${os.EOL}Все архивы актуальны, обработка не требуется`);
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
        console.log(chalk.magenta(`Удален файл: ${gzFile}`));
        deletedCount++;
      } catch (error) {
        console.error(chalk.red(`Ошибка при удалении файла ${gzFile}: ${error.message}`));
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

/**
 * Возвращает правильное окончание слова "поток" в зависимости от числа
 * @param {number} count - количество
 * @returns {string} - правильное склонение
 */
function getStreamsWord(count) {
  // Обрабатываем числа от 11 до 19 отдельно - они всегда с "потоков"
  if (count % 100 >= 11 && count % 100 <= 19) {
    return 'потоков';
  }
  
  switch (count % 10) {
    case 1: return 'поток';     // 1, 21, 31, ...
    case 2:
    case 3:
    case 4: return 'потока';    // 2-4, 22-24, ...
    default: return 'потоков';  // 0, 5-9, 10, ...
  }
}

/**
 * Возвращает оптимальное количество параллельных операций
 * @returns {number} - количество возможных потоков
 */
function getOptimalParallelCount() {
  // Получаем количество доступных CPU 
  const cpuCount = os.cpus().length;
  console.log(`Доступно: ${cpuCount} ${getStreamsWord(cpuCount)}`);
  
  // не меньше 1, если вдруг ошибка или вернется пустое значение
  return Math.max(1, cpuCount); 
}



/**
 * обрабатывает массив параллельно, запуская новую задачу сразу после завершения любой задачи
 * @param {Array} fileItems - файлы для обработки
 * @param {Function} processFileFn - функция обработки одного файла
 * @param {number} parallelThreads - сколько потоков обрабатывать параллельно
 * @returns {Promise<Array>} - результаты обработки
 */
async function smartParallelProcessing(fileItems, processFileFn, parallelThreads) {

  const results = []; // результаты обработки
  let taskCounter = 0; // счетчик задач для ID потока
  
  // Если нет файлов для обработки, возвращаем пустой массив
  if (fileItems.length === 0) return results;

  // Создаем промис, который разрешится, когда все задачи завершатся
  return new Promise(resolve => {

       // Создаем очередь задач с ограничением параллельности
    const queue = async.queue( (fileInfo, callback) => {
      try {
        // уникальный ID для текущей задачи
        // const taskId = ++taskCounter; // увеличиваем счетчик, бедет потоков столько сколько файлов
        const taskId = (queue.running() % parallelThreads) + 1; // номер потока, в рамках количества возможных параллельных

        // информация о файле для вывода в лог
        const fileName = path.basename(fileInfo.source);
        const startTime = Date.now();

        // какой по счету файл обрабатывается в данный момент
        const processedCount = fileItems.length - queue.length();
        
         // Информация о запуске задачи (используем taskId вместо queue.running())
        console.log(chalk.cyan(`[Поток ${taskId}] Старт: ${fileName} (${processedCount}/${fileItems.length})`));
        
        // с async/await не вышло, ругается на callback... переделала на then/catch
        processFileFn(fileInfo)
          .then(result => {
            // Добавляем результат в общий массив
            results.push(result);

                  // Вычисляем время обработки и количество оставшихся файлов
            const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(chalk.green(`[Поток ${taskId}] Готово: ${fileName} за ${processingTime}с (осталось: ${queue.length()})`));
          
           // Сообщаем очереди, что задача завершена
            callback(); // освобождаем потом, функция async.queue сама следит за количеством потоков
      })
          .catch (error => {
            // В случае ошибки добавляем информацию об ошибке
          results.push({ success: false, path: fileInfo.source, error: error.message });
          console.error(chalk.red.bold(`[Поток ${taskId}] Ошибка: ${fileName} - ${error.message}`));

             // Сообщаем очереди, что задача завершена (даже с ошибкой)
          callback();
        });
      } catch (error) {
        // Дополнительная обработка ошибок (например, если processFileFn не является функцией)
        console.error(`[Поток] Критическая ошибка: ${error.message}`);
        results.push({ success: false, path: fileInfo.source, error: error.message });
        callback();
      }
      }, parallelThreads); // максимальное количество параллельных задач

         // Обработчик события, когда очередь пуста и нет активных задач
      queue.drain(() => {
          // Все задачи выполнены, возвращаем результаты
      resolve(results);
      });

    // Вывод информации о начале обработки
      console.log(chalk.bgBlue(`Запускаю ${parallelThreads} параллельных ${getStreamsWord(parallelThreads)}...`));
      //console.log(chalk.bold.blue(`Запускаю ${parallelThreads} параллельных ${getStreamsWord(parallelThreads)}...`));
        
        // Добавляем все файлы в очередь
        // после настройки очереди
      queue.push(fileItems);
  }); 
} 


                // Запуски

if (shouldClear) {
  // Если указан флаг --clear, удаляем .gz файлы
  clearGzipFiles(directoryPath);
} else {
  // Иначе выполняем обычное сжатие
  autoCompress(directoryPath);
}
