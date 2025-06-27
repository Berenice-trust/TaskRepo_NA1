document.addEventListener('DOMContentLoaded', () => {
  const genreSelect = document.getElementById('genre_id');
  const subgenreSelect = document.getElementById('subgenre_id');
  if (!genreSelect || !subgenreSelect) return;

  // genresData должен быть передан сервером как window.genresData
  const genres = window.genresData || [];

  genreSelect.addEventListener('change', () => {
    const selectedGenreId = genreSelect.value;
    subgenreSelect.innerHTML = '<option value="">Выберите поджанр</option>';
    genres.forEach(g => {
      if (g.parent_id && String(g.parent_id) === selectedGenreId) {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = g.name;
        subgenreSelect.appendChild(opt);
      }
    });
  });
});