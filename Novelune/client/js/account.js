// Весь код внутри одного DOMContentLoaded для надёжности
document.addEventListener('DOMContentLoaded', () => {
  // --- Удаление аккаунта ---
  const deleteBtn = document.getElementById('deleteAccountBtn');
  const modal = document.getElementById('modalOverlay');
  const modalCancel = document.getElementById('modalCancel');
  const modalConfirm = document.getElementById('modalConfirm');

  // Если кнопка удаления есть, навешиваем обработчики
  if (deleteBtn) {
    // Открыть модалку подтверждения удаления
    deleteBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
    });

    // Закрыть модалку по кнопке "Отмена"
    modalCancel?.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    // Подтвердить удаление аккаунта
    modalConfirm?.addEventListener('click', async () => {
      modal.style.display = 'none';
      const res = await fetch('/api/user/delete', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        window.location.href = '/';
      } else {
        // Можно доработать: показать ошибку пользователю
        console.error(data.message || 'Ошибка удаления');
      }
    });

    // Закрытие по клику вне модального окна
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  // --- Редактирование профиля ---




  // Функция сброса формы профиля к актуальным значениям
  function resetProfileForm() {
    const displayName = document.querySelector('.profile-value[data-field="display_name"]')?.textContent.trim() || '';
    const email = document.querySelector('.profile-value[data-field="email"]')?.textContent.trim() || '';
    const bio = document.querySelector('.profile-value[data-field="bio"]')?.textContent.trim() || '';

    document.getElementById('displayNameInput').value = displayName === 'Не указан' ? '' : displayName;
    document.getElementById('emailInput').value = email;
    document.getElementById('bioInput').value = bio;

    document.getElementById('newPasswordInput').value = '';
    document.getElementById('repeatPasswordInput').value = '';
    showProfileErrors(null);
  }

  // Открытие модального окна редактирования профиля
  document.getElementById('editProfileBtn')?.addEventListener('click', () => {
    resetProfileForm();
    document.getElementById('editProfileModal').style.display = 'flex';
  });

  // Закрытие модального окна по кнопке "Отмена"
  document.getElementById('cancelEditProfile')?.addEventListener('click', () => {
    document.getElementById('editProfileModal').style.display = 'none';
  });

  // Закрытие модального окна по крестику
  document.getElementById('closeEditProfile')?.addEventListener('click', () => {
    document.getElementById('editProfileModal').style.display = 'none';
  });

  // Закрытие по клику вне формы
  document.getElementById('editProfileModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      e.currentTarget.style.display = 'none';
    }
  });

  // Функция для показа ошибок рядом с полями формы профиля
  function showProfileErrors(errors) {
    // Сначала очищаем все ошибки
    ['DisplayName', 'Email', 'Bio', 'NewPassword', 'RepeatPassword'].forEach(field => {
      document.getElementById('error' + field).textContent = '';
    });

    // Если есть ошибки — показываем их под соответствующими полями
    if (!errors) return;
    if (errors.display_name) document.getElementById('errorDisplayName').textContent = errors.display_name;
    if (errors.email) document.getElementById('errorEmail').textContent = errors.email;
    if (errors.bio) document.getElementById('errorBio').textContent = errors.bio;
    if (errors.new_password) document.getElementById('errorNewPassword').textContent = errors.new_password;
    if (errors.repeat_password) document.getElementById('errorRepeatPassword').textContent = errors.repeat_password;
  }

  // Обработка отправки формы редактирования профиля
  document.getElementById('editProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      display_name: form.display_name.value,
      email: form.email.value,
      bio: form.bio.value,
      new_password: form.new_password.value,
      repeat_password: form.repeat_password.value
    };
    // Очищаем ошибки перед отправкой
    showProfileErrors(null);

    // Отправляем данные на сервер
    const res = await fetch('/api/user/profile', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data),
      credentials: 'include'
    });
    const result = await res.json();
    if (res.ok && result.success) {
      window.location.reload();
    } else if (result.errors) {
      // Показываем ошибки рядом с полями
      showProfileErrors(result.errors);
    } else {
      alert('Ошибка сохранения профиля');
    }
  });



  // обработчик кнопки добавления Книги и главы
   const createBookBtn = document.getElementById('createBookBtn');
  if (createBookBtn) {
    createBookBtn.addEventListener('click', () => {
      window.location.href = '/books/new';
    });
  }

  const addChapterBtn = document.getElementById('addChapterBtn');
if (addChapterBtn) {
  addChapterBtn.addEventListener('click', () => {
    // Здесь должен быть bookId, если он есть на странице
    const bookId = window.currentBookId; // или получи другим способом
    if (bookId) {
      window.location.href = `/books/${bookId}/chapters/new`;
    } else {
      alert('Сначала сохраните книгу!');
    }
  });
}
});

