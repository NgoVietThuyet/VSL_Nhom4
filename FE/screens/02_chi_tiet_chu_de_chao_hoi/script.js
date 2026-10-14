// Interactive script for screen: Chi Tiết Chủ Đề: Chào Hỏi & Xã Giao

document.addEventListener('DOMContentLoaded', () => {
  // Script block
  // Simple bookmark toggle interaction
  const bookmarkBtn = document.getElementById('bookmark-btn');
  const bookmarkIcon = document.getElementById('bookmark-icon');
  let isBookmarked = false;

  bookmarkBtn.addEventListener('click', () => {
    isBookmarked = !isBookmarked;
    if (isBookmarked) {
      bookmarkIcon.style.fontVariationSettings = "'FILL' 1";
      bookmarkIcon.classList.add('text-secondary');
    } else {
      bookmarkIcon.style.fontVariationSettings = "'FILL' 0";
      bookmarkIcon.classList.remove('text-secondary');
    }
  });

  // Filter tabs active pill toggle
  const tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('bg-primary', 'text-on-primary', 'shadow-sm');
        t.classList.add('bg-surface-container-high', 'text-on-surface-variant');
      });
      tab.classList.remove('bg-surface-container-high', 'text-on-surface-variant');
      tab.classList.add('bg-primary', 'text-on-primary', 'shadow-sm');
    });
  });

  // Tự động kết nối Backend lấy danh sách từ vựng
  fetch('http://localhost:5228/api/v1/topics/1/signs')
    .then(res => res.json())
    .then(data => {
      if (data && data.status === 200 && Array.isArray(data.data)) {
        console.log(`[Web Screen 02] Đã kết nối Backend, tải ${data.data.length} ký hiệu.`);
      }
    })
    .catch(err => {
      console.warn('[Web Screen 02] Không thể kết nối Backend:', err.message);
    });
});
