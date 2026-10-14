// Interactive script for screen: Đăng Nhập Tài Khoản

document.addEventListener('DOMContentLoaded', () => {
  const identityInput = document.getElementById('identity-input');
  const passwordInput = document.getElementById('password-input');
  const togglePasswordBtn = document.getElementById('toggle-password');
  const pwdIcon = document.getElementById('pwd-icon');
  const loginForm = document.querySelector('form');
  const btnSubmit = document.getElementById('btn-submit');

  // Gán giá trị mặc định tài khoản thử nghiệm
  if (identityInput && (!identityInput.value || identityInput.value.includes('lananh'))) {
    identityInput.value = 'minhanh.vsl@gmail.com';
  }
  if (passwordInput && !passwordInput.value) {
    passwordInput.value = '123456';
  }

  // Toggle ẩn/hiện mật khẩu
  if (togglePasswordBtn && passwordInput && pwdIcon) {
    togglePasswordBtn.addEventListener('click', function() {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      pwdIcon.textContent = isPassword ? 'visibility' : 'visibility_off';
    });
  }

  // Xử lý gửi form đăng nhập gọi API Backend
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const email = identityInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        alert('Vui lòng nhập đầy đủ email và mật khẩu');
        return;
      }

      const originalBtnHtml = btnSubmit.innerHTML;
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<span>Đang xác thực...</span>';

      try {
        const response = await fetch('http://localhost:5228/api/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const resData = await response.json();

        if (response.ok && resData.status === 200) {
          const authData = resData.data;
          // Lưu token và thông tin người dùng vào localStorage
          localStorage.setItem('vsl_token', authData.accessToken);
          localStorage.setItem('vsl_user', JSON.stringify(authData.user));

          // Chuyển hướng sang Màn hình 08: Trang chủ & Tiến độ
          window.location.href = '../08_trang_chu_tien_do/index.html';
        } else {
          alert('Đăng nhập thất bại: ' + (resData.message || 'Email hoặc mật khẩu không chính xác'));
        }
      } catch (err) {
        console.warn('Lỗi kết nối Backend:', err);
        alert('Không thể kết nối đến máy chủ Backend (http://localhost:5228). Vui lòng đảm bảo Backend đang chạy.');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnHtml;
      }
    });
  }

  const biometricBtn = document.getElementById('btn-biometric');
  if (biometricBtn) {
    biometricBtn.addEventListener('click', function() {
      biometricBtn.classList.add('bg-surface-container-highest');
      setTimeout(() => {
        biometricBtn.classList.remove('bg-surface-container-highest');
        // Giả lập sinh trắc học tự động đăng nhập với user mẫu
        identityInput.value = 'minhanh.vsl@gmail.com';
        passwordInput.value = '123456';
        loginForm.dispatchEvent(new Event('submit'));
      }, 300);
    });
  }

  // Xử lý mở/đóng Modal Đăng Ký
  const btnRegisterLink = document.getElementById('btn-register-link');
  const registerModal = document.getElementById('register-modal');
  const btnCloseRegister = document.getElementById('btn-close-register');
  const registerForm = document.getElementById('register-form');
  const btnSubmitRegister = document.getElementById('btn-submit-register');

  if (btnRegisterLink && registerModal) {
    btnRegisterLink.addEventListener('click', () => {
      registerModal.classList.remove('hidden');
    });
  }

  if (btnCloseRegister && registerModal) {
    btnCloseRegister.addEventListener('click', () => {
      registerModal.classList.add('hidden');
    });
  }

  if (registerModal) {
    registerModal.addEventListener('click', (e) => {
      if (e.target === registerModal) {
        registerModal.classList.add('hidden');
      }
    });
  }

  // Xử lý gửi Form Đăng Ký
  if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const fullName = document.getElementById('reg-fullname').value.trim();
      const email = document.getElementById('reg-email').value.trim().toLowerCase();
      const phone = document.getElementById('reg-phone').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirmPassword = document.getElementById('reg-confirm-password').value;

      if (!fullName || !email || !password) {
        alert('Vui lòng điền đầy đủ các thông tin bắt buộc.');
        return;
      }

      if (password.length < 6) {
        alert('Mật khẩu phải có ít nhất 6 ký tự.');
        return;
      }

      if (password !== confirmPassword) {
        alert('Mật khẩu xác nhận không khớp với mật khẩu.');
        return;
      }

      const origBtnHtml = btnSubmitRegister.innerHTML;
      btnSubmitRegister.disabled = true;
      btnSubmitRegister.innerHTML = '<span>Đang khởi tạo tài khoản...</span>';

      try {
        const response = await fetch('http://localhost:5228/api/v1/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fullName, email, password, phone }),
        });

        const resData = await response.json();

        if (response.ok && (resData.status === 200 || resData.status === 201)) {
          const authData = resData.data;
          localStorage.setItem('vsl_token', authData.accessToken);
          localStorage.setItem('vsl_user', JSON.stringify(authData.user));

          alert(`🎉 Chúc mừng ${authData.user?.fullName || fullName} đã đăng ký tài khoản thành công!`);
          registerModal.classList.add('hidden');

          // Chuyển hướng sang màn hình Trang chủ & Tiến độ
          window.location.href = '../08_trang_chu_tien_do/index.html';
        } else {
          alert('Đăng ký thất bại: ' + (resData.message || 'Không thể tạo tài khoản'));
        }
      } catch (err) {
        console.warn('Lỗi kết nối Backend:', err);
        alert('Không thể kết nối đến máy chủ Backend (http://localhost:5228). Vui lòng đảm bảo Backend đang chạy.');
      } finally {
        btnSubmitRegister.disabled = false;
        btnSubmitRegister.innerHTML = origBtnHtml;
      }
    });
  }
});
