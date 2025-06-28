document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('deleteChapterModal');
  const form = document.getElementById('deleteChapterForm');
  let currentBookId = null;
  let currentChapterId = null;

  document.querySelectorAll('.delete-chapter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentBookId = btn.dataset.bookId;
      currentChapterId = btn.dataset.chapterId;
      form.action = `/books/${currentBookId}/chapters/${currentChapterId}/delete`;
      modal.style.display = 'flex';
    });
  });

  document.getElementById('cancelDeleteChapter').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });
});