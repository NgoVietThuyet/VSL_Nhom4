// Interactive script for screen: Trang Chủ & Tiến Độ

const API_BASE = 'http://localhost:5228/api/v1';
const RING_CIRCUMFERENCE = 188.4;

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setWidth(id, percent) {
  const el = document.getElementById(id);
  if (el) el.style.width = `${percent}%`;
}

function percent(part, total) {
  return total > 0 ? Math.round((part * 100) / total) : 0;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

function renderUser(user) {
  if (!user) return;
  setText('greeting', `Xin chào, ${user.fullName}!`);
  setText('user-level', `Cấp độ ${user.level ?? 1}`);
  setText('streak-text', `Chuỗi ${user.streakDays ?? 0} ngày học liên tiếp`);
  setText('xp-text', `${(user.xp ?? 0).toLocaleString('vi-VN')} điểm kinh nghiệm`);
  setText('xp-total', (user.xp ?? 0).toLocaleString('vi-VN'));

  if (user.avatarUrl) {
    document.querySelectorAll('header img.rounded-full').forEach((img) => {
      img.src = user.avatarUrl;
    });
  }
}

function renderOverview(overview) {
  if (!overview) return;
  const progress = overview.overallProgress ?? 0;

  setText('level-title', overview.levelTitle || '');
  setText('progress-percent', `${progress}%`);
  const ring = document.getElementById('progress-ring');
  if (ring) ring.setAttribute('stroke-dashoffset', (RING_CIRCUMFERENCE * (1 - progress / 100)).toFixed(2));

  setText('signs-count', `${overview.masteredSigns ?? 0}/${overview.totalSigns ?? 0}`);
  setWidth('signs-bar', percent(overview.masteredSigns ?? 0, overview.totalSigns ?? 0));
  setText('phrases-count', `${overview.masteredPhrases ?? 0}/${overview.totalPhrases ?? 0}`);
  setWidth('phrases-bar', percent(overview.masteredPhrases ?? 0, overview.totalPhrases ?? 0));

  setText('open-topics', overview.openTopicsCount ?? 0);
  setText('ai-accuracy', overview.aiAccuracy != null ? `${overview.aiAccuracy}%` : '--');
}

function renderCurrentTopic(data) {
  const topic = data.currentTopic;
  if (!topic) return;
  setText('topic-title', `Chủ đề ${topic.displayOrder ?? ''}: ${topic.name}`);
  setText('topic-progress', `Tiến độ ${data.currentTopicProgress ?? 0}%`);
  setText('topic-signs', `${data.currentTopicCompletedSigns ?? 0} / ${topic.signCount ?? 0} ký hiệu`);
  setText('topic-level', topic.level || '');
}

function renderReviewSigns(signs) {
  const list = document.getElementById('review-list');
  if (!list || !signs || signs.length === 0) return;

  list.innerHTML = signs.map((sign) => `
    <article class="p-3.5 rounded-[20px] bg-surface-container-lowest shadow-sm flex items-center justify-between gap-space-sm hover:shadow-md transition-shadow">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-12 h-12 rounded-xl bg-surface-container overflow-hidden flex-shrink-0 flex items-center justify-center">
          ${sign.videoThumb
            ? `<img class="w-full h-full object-cover" src="${escapeHtml(sign.videoThumb)}" alt="${escapeHtml(sign.nameVi)}"/>`
            : '<span class="material-symbols-outlined text-outline">sign_language</span>'}
        </div>
        <div class="flex flex-col min-w-0">
          <h4 class="font-label-lg text-label-lg font-bold text-on-surface truncate">${escapeHtml(sign.nameVi)}</h4>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold flex items-center gap-1">
              <span class="material-symbols-outlined text-[12px]">refresh</span>
              <span>Cần ôn tập</span>
            </span>
            ${sign.topicName ? `<span class="font-body-sm text-body-sm text-on-surface-variant truncate">${escapeHtml(sign.topicName)}</span>` : ''}
          </div>
        </div>
      </div>
    </article>
  `).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  // Lấy dữ liệu từ Backend Spring Boot
  const token = localStorage.getItem('vsl_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}/dashboard`, { headers });

    if (response.status === 401) {
      localStorage.removeItem('vsl_token');
      setText('greeting', 'Vui lòng đăng nhập để xem tiến độ học tập');
      return;
    }

    const resData = await response.json();
    if (response.ok && resData.data) {
      const data = resData.data;
      renderUser(data.user);
      renderOverview(data.courseOverview);
      renderCurrentTopic(data);
      renderReviewSigns(data.reviewSigns);
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
