document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('deleteBookModal');
  const form = document.getElementById('deleteBookForm');
  let currentBookId = null;

  document.querySelectorAll('.delete-book-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentBookId = btn.dataset.bookId;
      form.action = `/books/${currentBookId}/delete`;
      modal.style.display = 'flex';
    });
  });

  document.getElementById('cancelDeleteBook').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });
});