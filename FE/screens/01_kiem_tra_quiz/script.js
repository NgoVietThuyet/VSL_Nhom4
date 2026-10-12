// Interactive script for screen: Kiểm Tra Kiến Thức Quiz

document.addEventListener('DOMContentLoaded', () => {
  // Script block
  // Simple countdown timer micro-interaction
  let secondsRemaining = 45;
  const timerElem = document.getElementById('quiz-timer');
  const timerInterval = setInterval(() => {
    if (secondsRemaining > 0) {
      secondsRemaining--;
      const formatted = secondsRemaining < 10 ? '0' + secondsRemaining : secondsRemaining;
      if (timerElem) timerElem.textContent = '00:' + formatted;
    } else {
      clearInterval(timerInterval);
    }
  }, 1000);

  // Micro-interaction for replay button
  const replayBtn = document.getElementById('replay-btn');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      replayBtn.classList.add('rotate-180');
      setTimeout(() => replayBtn.classList.remove('rotate-180'), 300);
    });
  }

});
