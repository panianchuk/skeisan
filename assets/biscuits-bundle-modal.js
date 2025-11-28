document.addEventListener('DOMContentLoaded', function () {
  const trigger = document.getElementById('biscuits-bundle-trigger');
  const modal = document.getElementById('biscuits-bundle-modal');
  const overlay = document.getElementById('biscuits-bundle-modal-overlay');
  const closeBtn = document.getElementById('biscuits-bundle-close');

  function openModal() {
    modal.classList.add('is-open');
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('is-open');
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  if (trigger) {
    trigger.addEventListener('click', openModal);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  if (overlay) {
    overlay.addEventListener('click', closeModal);
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });
});
