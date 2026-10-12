// Interactive script for screen: Trang Chủ & Tiến Độ

document.addEventListener('DOMContentLoaded', () => {
  // Script block
  // Micro-interaction for feedback ripple and dynamic greeting interaction
  document.addEventListener('DOMContentLoaded', () => {
    const replayButtons = document.querySelectorAll('button[aria-label]');
    replayButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        btn.classList.add('rotate-180');
        setTimeout(() => {
          btn.classList.remove('rotate-180');
        }, 300);
      });
    });
  });

});
