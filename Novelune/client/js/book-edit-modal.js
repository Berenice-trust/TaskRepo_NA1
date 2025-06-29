document.addEventListener('DOMContentLoaded', () => {
  const editBtn = document.getElementById('editBookBtn');
  const modal = document.getElementById('editBookModal');
  const cancelBtn = document.getElementById('cancelEditBook');

  if (editBtn && modal) {
    editBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
    });
  }
  if (cancelBtn && modal) {
    cancelBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }
});