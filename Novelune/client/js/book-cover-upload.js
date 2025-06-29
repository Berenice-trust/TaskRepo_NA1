

document.addEventListener('DOMContentLoaded', () => {
  const coverInput = document.getElementById('coverInput');
  const coverPreview = document.getElementById('coverPreview');
  if (coverInput && coverPreview) {
    coverInput.addEventListener('change', () => {
      const file = coverInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          coverPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
});