// Interactive script for screen: Đăng Nhập Tài Khoản

document.addEventListener('DOMContentLoaded', () => {
  // Script block
  (function() {
    const passwordInput = document.getElementById('password-input');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const pwdIcon = document.getElementById('pwd-icon');

    if (togglePasswordBtn && passwordInput && pwdIcon) {
      togglePasswordBtn.addEventListener('click', function() {
        const isPassword = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
        pwdIcon.textContent = isPassword ? 'visibility' : 'visibility_off';
      });
    }

    const biometricBtn = document.getElementById('btn-biometric');
    if (biometricBtn) {
      biometricBtn.addEventListener('click', function() {
        biometricBtn.classList.add('bg-surface-container-highest');
        setTimeout(() => {
          biometricBtn.classList.remove('bg-surface-container-highest');
        }, 300);
      });
    }
  })();

});
