document.addEventListener('DOMContentLoaded', () => {
  const deleteBtn = document.getElementById('deleteAccountBtn');
  const modal = document.getElementById('modalOverlay');
  const modalCancel = document.getElementById('modalCancel');
  const modalConfirm = document.getElementById('modalConfirm');

  if (!deleteBtn) return;

  deleteBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
  });

  modalCancel?.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  modalConfirm?.addEventListener('click', async () => {
    modal.style.display = 'none';
    const res = await fetch('/api/user/delete', { method: 'POST', credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      window.location.href = '/';
    } else {
      // Можно показать ошибку в модалке или статусе
      alert(data.message || 'Ошибка удаления');
    }
  });

  // Закрытие по клику вне модального окна
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });
});