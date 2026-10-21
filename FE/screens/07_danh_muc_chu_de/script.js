// Interactive script for screen: Danh Mục Chủ Đề

const API_BASE = 'http://localhost:5228/api/v1';
const SUMMARY_RING_LENGTH = 88;
const SEARCH_DEBOUNCE_MS = 300;

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

async function fetchTopics(level = '', search = '') {
  const params = new URLSearchParams();
  if (level) params.append('level', level);
  if (search) params.append('search', search);
  const query = params.toString() ? `?${params}` : '';

  const token = localStorage.getItem('vsl_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(`${API_BASE}/topics${query}`, { headers });

  // Token hết hạn: xóa token và tải lại danh mục ở chế độ khách (không có tiến độ)
  if (response.status === 401 && token) {
    localStorage.removeItem('vsl_token');
    return fetchTopics(level, search);
  }

  const resData = await response.json();
  return Array.isArray(resData.data) ? resData.data : [];
}

function renderTopicCard(topic) {
  const hasProgress = topic.progress != null;
  const done = topic.progress === 100;
  const statusText = done ? 'Hoàn thành' : topic.progress > 0 ? 'Đang học' : 'Chưa học';

  return `
    <a class="topic-item flex flex-col justify-between p-3.5 rounded-xl bg-surface-container-lowest shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
       href="../02_chi_tiet_chu_de_chao_hoi/index.html?topicId=${topic.topicId}">
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="text-2xl select-none" role="img">${escapeHtml(topic.emoji || '📚')}</span>
          ${topic.level ? `<span class="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant">${escapeHtml(topic.level)}</span>` : ''}
        </div>
        <div class="flex flex-col">
          <h4 class="font-label-lg text-label-lg text-on-surface line-clamp-1">${topic.displayOrder ?? ''}. ${escapeHtml(topic.name)}</h4>
          <span class="font-body-sm text-body-sm text-on-surface-variant">${topic.signCount ?? 0} Ký hiệu</span>
        </div>
      </div>
      ${hasProgress ? `
      <div class="flex flex-col gap-1.5 mt-3 pt-2">
        <div class="flex justify-between items-center text-label-sm font-label-sm">
          <span class="${topic.progress > 0 ? 'text-tertiary' : 'text-outline'} font-bold">${topic.progress}%</span>
          <span class="text-outline">${statusText}</span>
        </div>
        <div class="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
          <div class="h-full ${topic.progress > 0 ? 'bg-tertiary' : 'bg-outline-variant'} rounded-full" style="width: ${topic.progress}%;"></div>
        </div>
      </div>` : ''}
    </a>
  `;
}

// Tổng kết toàn khóa: tính từ danh sách đầy đủ (không lọc)
function renderSummary(allTopics) {
  const totalSigns = allTopics.reduce((sum, t) => sum + (t.signCount ?? 0), 0);
  document.getElementById('catalog-subtitle').textContent =
    `${allTopics.length} chủ đề · ${totalSigns} ký hiệu Ngôn ngữ Ký hiệu Việt Nam (VSL)`;

  const card = document.getElementById('summary-card');
  const loggedIn = allTopics.some((t) => t.progress != null);
  if (!loggedIn) return;

  const mastered = allTopics.reduce((sum, t) => sum + (t.masteredCount ?? 0), 0);
  const completedTopics = allTopics.filter((t) => t.signCount > 0 && t.progress === 100).length;
  const percent = totalSigns > 0 ? Math.round((mastered * 100) / totalSigns) : 0;

  document.getElementById('summary-percent').textContent = `${percent}%`;
  document.getElementById('summary-ring')
    .setAttribute('stroke-dashoffset', (SUMMARY_RING_LENGTH * (1 - percent / 100)).toFixed(1));
  document.getElementById('summary-topics').textContent =
    `Đã hoàn thành ${completedTopics} / ${allTopics.length} chủ đề`;
  document.getElementById('summary-signs').textContent = `${mastered} ký hiệu`;
  card.classList.remove('hidden');
  card.classList.add('flex');
}

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('topic-search-input');
  const clearBtn = document.getElementById('clear-search-btn');
  const emptyState = document.getElementById('search-empty-state');
  const topicsGrid = document.getElementById('topics-grid');
  const indicator = document.getElementById('topic-count-indicator');
  const filterChips = document.querySelectorAll('.filter-chip');
  const resetFilterBtn = document.getElementById('reset-filter-btn');

  let currentLevel = '';
  let searchQuery = '';
  let debounceTimer = null;
  let requestId = 0;

  async function loadTopics() {
    const thisRequest = ++requestId;
    try {
      const topics = await fetchTopics(currentLevel, searchQuery.trim());
      if (thisRequest !== requestId) return; // bỏ kết quả của request cũ

      if (topics.length === 0) {
        topicsGrid.innerHTML = '';
        topicsGrid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');
        indicator.textContent = '0 kết quả';
      } else {
        topicsGrid.innerHTML = topics.map(renderTopicCard).join('');
        topicsGrid.classList.remove('hidden');
        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');
        indicator.textContent = `${topics.length} chủ đề`;
      }
    } catch (err) {
      console.warn('[Web Screen 07] Không thể kết nối Backend:', err.message);
      indicator.textContent = 'Không tải được dữ liệu';
    }
  }

  function setActiveChip(level) {
    filterChips.forEach((c) => {
      const active = c.getAttribute('data-filter') === level;
      c.classList.toggle('bg-primary', active);
      c.classList.toggle('text-on-primary', active);
      c.classList.toggle('bg-surface-container-lowest', !active);
      c.classList.toggle('text-on-surface-variant', !active);
    });
  }

  function toggleClearButton() {
    const show = searchQuery.length > 0;
    clearBtn.classList.toggle('hidden', !show);
    clearBtn.classList.toggle('flex', show);
  }

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    toggleClearButton();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadTopics, SEARCH_DEBOUNCE_MS);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    toggleClearButton();
    loadTopics();
    searchInput.focus();
  });

  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      currentLevel = chip.getAttribute('data-filter');
      setActiveChip(currentLevel);
      loadTopics();
    });
  });

  resetFilterBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    currentLevel = '';
    toggleClearButton();
    setActiveChip('');
    loadTopics();
  });

  // Lần đầu: danh sách đầy đủ dùng cho cả lưới và thẻ tổng kết
  fetchTopics()
    .then(renderSummary)
    .catch((err) => console.warn('[Web Screen 07] Không thể tải tổng kết:', err.message));
  loadTopics();
});
