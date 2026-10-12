// Interactive script for screen: Hồ Sơ Cá Nhân & Thành Tích

document.addEventListener('DOMContentLoaded', () => {
  // Script block
  (function() {
    const filterButtons = document.querySelectorAll('.badge-filter-btn');
    const badgeCards = document.querySelectorAll('.badge-card');

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Reset button states
        filterButtons.forEach(b => {
          b.classList.remove('bg-primary', 'text-on-primary', 'shadow-sm');
          b.classList.add('bg-surface-container', 'text-on-surface-variant');
        });
        
        // Active clicked button
        btn.classList.add('bg-primary', 'text-on-primary', 'shadow-sm');
        btn.classList.remove('bg-surface-container', 'text-on-surface-variant');

        const filter = btn.getAttribute('data-filter');

        badgeCards.forEach(card => {
          const status = card.getAttribute('data-status');
          if (filter === 'all' || filter === status) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        });
      });
    });
  })();

});
