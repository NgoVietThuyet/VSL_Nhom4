// Interactive script for screen: Phòng Thực Hành AI Camera

document.addEventListener('DOMContentLoaded', () => {
  // Script block
  // Micro-interactions and HUD feedback handling
  (function () {
    const pipBtn = document.getElementById('pip-expand-btn');
    const pipContainer = document.getElementById('pip-container');
    const retryBtn = document.getElementById('btn-retry');
    const timerElem = document.getElementById('ai-timer');
    let isPipExpanded = false;

    // PiP resize toggle
    if (pipBtn && pipContainer) {
      pipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isPipExpanded = !isPipExpanded;
        if (isPipExpanded) {
          pipContainer.classList.remove('w-28', 'h-36');
          pipContainer.classList.add('w-44', 'h-56');
          pipBtn.innerHTML = '<span class="material-symbols-outlined text-[14px]">close_fullscreen</span>';
        } else {
          pipContainer.classList.remove('w-44', 'h-56');
          pipContainer.classList.add('w-28', 'h-36');
          pipBtn.innerHTML = '<span class="material-symbols-outlined text-[14px]">open_in_full</span>';
        }
      });
    }

    // Practice retry simulation feedback
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        let count = 0;
        retryBtn.classList.add('opacity-70');
        if (timerElem) timerElem.textContent = '00:00 / 00:05s';
        const interval = setInterval(() => {
          count++;
          if (timerElem) {
            timerElem.textContent = `00:0${Math.min(count, 5)} / 00:05s`;
          }
          if (count >= 3) {
            clearInterval(interval);
            retryBtn.classList.remove('opacity-70');
          }
        }, 1000);
      });
    }

    // Camera switch button visual feedback
    const switchCamBtn = document.getElementById('switch-camera');
    if (switchCamBtn) {
      switchCamBtn.addEventListener('click', () => {
        switchCamBtn.classList.add('rotate-180');
        setTimeout(() => switchCamBtn.classList.remove('rotate-180'), 350);
      });
    }
  })();

});
