// document.addEventListener('DOMContentLoaded', () => {
//   const coverInput = document.getElementById('coverInput');
//   const coverPreview = document.getElementById('coverPreview');
//   const coverRect = document.querySelector('.book-cover-rect');
//   if (coverRect && coverInput) {
//     coverRect.addEventListener('click', () => {
//       console.log('Клик по прямоугольнику для загрузки обложки');
//       coverInput.click();
//     });
//     coverInput.addEventListener('change', () => {
//       const file = coverInput.files[0];
//       console.log('Выбран файл:', file);
//       if (file) {
//         const reader = new FileReader();
//         reader.onload = e => {
//           coverPreview.src = e.target.result;
//           console.log('Предпросмотр обновлён');
//         };
//         console.log('Начинаю чтение файла через FileReader');
//         reader.readAsDataURL(file); 
//       }
//     });
//   } else {
//     console.log('coverRect или coverInput не найден');
//   }
// });

document.addEventListener('DOMContentLoaded', () => {
  const coverInput = document.getElementById('coverInput');
  const coverPreview = document.getElementById('coverPreview');
  if (coverInput && coverPreview) {
    coverInput.addEventListener('change', () => {
      const file = coverInput.files[0];
      console.log('Выбран файл:', file);
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          coverPreview.src = e.target.result;
          console.log('Предпросмотр обновлён');
        };
        reader.readAsDataURL(file);
      }
    });
  }
});