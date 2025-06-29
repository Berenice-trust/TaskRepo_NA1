document.addEventListener('DOMContentLoaded', () => {
    console.log('avatar-upload.js loaded');

  const avatarInput = document.getElementById('avatarInput');
  const avatarPreview = document.getElementById('avatarPreview');
  const form = document.getElementById('avatarUploadForm');

  if (!avatarInput || !form) return;

//   console.log('avatarInput:', avatarInput, 'form:', form);
  

  avatarInput.addEventListener('change', async function(e) {
    console.log('File selected:', e.target.files[0]);
    const file = e.target.files[0];
    if (!file) return;

    // Проверка размера
    if (file.size > 10 * 1024 * 1024) {
      alert('Файл слишком большой! Максимум 10 МБ.');
      e.target.value = '';
      return;
    }

    // Показываем превью
    const reader = new FileReader();
    reader.onload = function(ev) {
      avatarPreview.src = ev.target.result;
    };
    reader.readAsDataURL(file);

    // Отправляем файл через fetch
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/avatar/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (response.redirected) {
        window.location.href = response.url;
      } else {
        window.location.reload();
      }
    } catch (err) {
      alert('Ошибка загрузки аватара');
    }
  });

  // Клик по прямоугольнику вызывает выбор файла
  const avatarLabel = document.querySelector('.avatar-label');
  if (avatarLabel) {
    avatarLabel.addEventListener('click', () => avatarInput.click());
  }
});

