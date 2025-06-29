document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('booksSearchInput');
  if (!searchInput || !window.booksData) return;

  const books = window.booksData;
  const fuse = new Fuse(books, {
    keys: [
      { name: 'title', weight: 0.5 },
      { name: 'author_display_name', weight: 0.4 },
      { name: 'author_name', weight: 0.3 }
    ],
    threshold: 0.6,
    ignoreLocation: true,
    minMatchCharLength: 1,
    useExtendedSearch: true
  });

  searchInput.addEventListener('input', e => {
    const value = e.target.value.trim();
    const list = document.querySelector('.books-list');
    if (!value) {
      list.querySelectorAll('.book-item').forEach(li => li.style.display = '');
      return;
    }
    let result;
    if (value.length < 3) {
      result = fuse.search(`'${value}`);
    } else {
      result = fuse.search(value);
    }
    list.querySelectorAll('.book-item').forEach(li => li.style.display = 'none');
    result.forEach(r => {
      const li = list.querySelector(`[data-book-id="${r.item.id}"]`);
      if (li) li.style.display = '';
    });
  });
});