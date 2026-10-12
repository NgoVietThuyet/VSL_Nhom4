// Interactive script for screen: Chi Tiết Ký Hiệu

document.addEventListener('DOMContentLoaded', () => {
  // Script block
  (function() {
    const bookmarkBtn = document.getElementById('bookmark-btn');
    const bookmarkIcon = document.getElementById('bookmark-icon');
    let isBookmarked = false;

    if (bookmarkBtn && bookmarkIcon) {
      bookmarkBtn.addEventListener('click', () => {
        isBookmarked = !isBookmarked;
        if (isBookmarked) {
          bookmarkIcon.textContent = 'bookmark';
          bookmarkIcon.style.fontVariationSettings = "'FILL' 1";
          bookmarkBtn.classList.add('text-secondary');
        } else {
          bookmarkIcon.textContent = 'bookmark';
          bookmarkIcon.style.fontVariationSettings = "'FILL' 0";
          bookmarkBtn.classList.remove('text-secondary');
        }
      });
    }

    const playPauseBtn = document.getElementById('play-pause-btn');
    const playIcon = document.getElementById('play-icon');
    let isPlaying = false;

    if (playPauseBtn && playIcon) {
      playPauseBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        playIcon.textContent = isPlaying ? 'pause' : 'play_arrow';
        if (isPlaying) {
          playIcon.classList.remove('ml-0.5');
        } else {
          playIcon.classList.add('ml-0.5');
        }
      });
    }

    const speed05 = document.getElementById('speed-05');
    const speed10 = document.getElementById('speed-10');

    if (speed05 && speed10) {
      speed05.addEventListener('click', () => {
        speed05.className = 'px-2.5 py-1 rounded-full text-on-primary bg-primary text-label-md font-label-md shadow-sm transition-all';
        speed10.className = 'px-2.5 py-1 rounded-full text-on-surface-variant hover:text-on-primary text-label-md font-label-md transition-all';
      });

      speed10.addEventListener('click', () => {
        speed10.className = 'px-2.5 py-1 rounded-full text-on-primary bg-primary text-label-md font-label-md shadow-sm transition-all';
        speed05.className = 'px-2.5 py-1 rounded-full text-on-surface-variant hover:text-on-primary text-label-md font-label-md transition-all';
      });
    }

    const loopBtn = document.getElementById('loop-toggle');
    let isLooping = true;
    if (loopBtn) {
      loopBtn.addEventListener('click', () => {
        isLooping = !isLooping;
        loopBtn.innerHTML = `
          <span class="material-symbols-outlined text-[16px]">${isLooping ? 'repeat' : 'repeat_one'}</span>
          <span>Lặp lại: ${isLooping ? 'Bật' : 'Tắt'}</span>
        `;
        if (isLooping) {
          loopBtn.classList.add('text-primary-fixed');
          loopBtn.classList.remove('text-outline-variant');
        } else {
          loopBtn.classList.remove('text-primary-fixed');
          loopBtn.classList.add('text-outline-variant');
        }
      });
    }
  })();

});
