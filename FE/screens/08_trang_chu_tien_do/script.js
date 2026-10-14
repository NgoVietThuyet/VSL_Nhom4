// Interactive script for screen: Trang Chủ & Tiến Độ

document.addEventListener('DOMContentLoaded', async () => {
  // Lấy dữ liệu từ Backend Spring Boot
  const token = localStorage.getItem('vsl_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch('http://localhost:5228/api/v1/dashboard', { headers });
    const resData = await response.json();

    if (response.ok && resData.status === 200 && resData.data) {
      const data = resData.data;
      const user = data.user;

      if (user) {
        // Cập nhật tên người dùng
        const greetingHeader = document.querySelector('h1.font-headline-md');
        if (greetingHeader) {
          greetingHeader.textContent = `Xin chào, ${user.fullName}!`;
        }

        // Cập nhật avatar trên header nếu có
        const avatarImgs = document.querySelectorAll('header img.rounded-full');
        if (avatarImgs.length > 0 && user.avatarUrl) {
          avatarImgs.forEach(img => img.src = user.avatarUrl);
        }

        // Cập nhật chuỗi ngày học (streak)
        const streakBadges = document.querySelectorAll('header .font-bold.text-on-secondary-fixed, .font-label-lg.font-bold.text-on-secondary-fixed');
        if (streakBadges.length > 0 && user.streakDays) {
          streakBadges.forEach(b => {
            if (b.textContent.includes('ngày')) {
              b.textContent = `${user.streakDays} ngày`;
            }
          });
        }
      }
    }
  } catch (err) {
    console.warn('[Web Screen 08] Không thể fetch dữ liệu từ Backend:', err.message);
  }

  // Micro-interactions
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
