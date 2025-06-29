document.addEventListener("DOMContentLoaded", () => {
  function setupGenreSubgenre(genreSelectId, subgenreSelectId) {
    const genreSelect = document.getElementById(genreSelectId);
    const subgenreSelect = document.getElementById(subgenreSelectId);
    if (!genreSelect || !subgenreSelect || !window.genresData) return;

    function updateSubgenres() {
      const genreId = Number(genreSelect.value);
      subgenreSelect.innerHTML = '<option value="">Выберите поджанр</option>';
      window.genresData.forEach((g) => {
        if (g.parent_id === genreId) {
          const opt = document.createElement("option");
          opt.value = g.id;
          opt.textContent = g.name;
          subgenreSelect.appendChild(opt);
        }
      });
    }

    genreSelect.addEventListener("change", updateSubgenres);

    // При открытии формы сразу показать поджанры для выбранного жанра
    updateSubgenres();
  }

  setupGenreSubgenre("genreSelect", "subgenreSelect");
  setupGenreSubgenre("genre_id", "subgenre_id"); // для создания книги
  setupGenreSubgenre("editGenre", "editSubgenre"); // для модального окна редактирования
});
