// Interactive script for screen: Danh Mục Chủ Đề

document.addEventListener('DOMContentLoaded', () => {
  // Script block
  (function() {
    const searchInput = document.getElementById('topic-search-input');
    const clearBtn = document.getElementById('clear-search-btn');
    const topicCards = document.querySelectorAll('.topic-item');
    const emptyState = document.getElementById('search-empty-state');
    const topicsGrid = document.getElementById('topics-grid');
    const indicator = document.getElementById('topic-count-indicator');
    const filterChips = document.querySelectorAll('.filter-chip');
    const resetFilterBtn = document.getElementById('reset-filter-btn');

    let currentFilter = 'all';
    let searchQuery = '';

    function filterTopics() {
      let visibleCount = 0;
      const normalizedQuery = searchQuery.trim().toLowerCase();

      topicCards.forEach(card => {
        const title = card.getAttribute('data-title') || '';
        const category = card.getAttribute('data-category') || '';

        const matchesQuery = !normalizedQuery || title.includes(normalizedQuery);
        const matchesCategory = currentFilter === 'all' || category.includes(currentFilter);

        if (matchesQuery && matchesCategory) {
          card.classList.remove('hidden');
          card.classList.add('flex');
          visibleCount++;
        } else {
          card.classList.add('hidden');
          card.classList.remove('flex');
        }
      });

      if (visibleCount === 0) {
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');
        topicsGrid.classList.add('hidden');
        indicator.textContent = '0 kết quả';
      } else {
        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');
        topicsGrid.classList.remove('hidden');
        indicator.textContent = visibleCount + ' chủ đề hiển thị';
      }
    }

    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (searchQuery.length > 0) {
        clearBtn.classList.remove('hidden');
        clearBtn.classList.add('flex');
      } else {
        clearBtn.classList.add('hidden');
        clearBtn.classList.remove('flex');
      }
      filterTopics();
    });

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearBtn.classList.add('hidden');
      clearBtn.classList.remove('flex');
      filterTopics();
      searchInput.focus();
    });

    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => {
          c.classList.remove('bg-primary', 'text-on-primary');
          c.classList.add('bg-surface-container-lowest', 'text-on-surface-variant');
        });
        chip.classList.add('bg-primary', 'text-on-primary');
        chip.classList.remove('bg-surface-container-lowest', 'text-on-surface-variant');

        currentFilter = chip.getAttribute('data-filter');
        filterTopics();
      });
    });

    resetFilterBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearBtn.classList.add('hidden');
      clearBtn.classList.remove('flex');

      filterChips.forEach(c => {
        if (c.getAttribute('data-filter') === 'all') {
          c.classList.add('bg-primary', 'text-on-primary');
          c.classList.remove('bg-surface-container-lowest', 'text-on-surface-variant');
        } else {
          c.classList.remove('bg-primary', 'text-on-primary');
          c.classList.add('bg-surface-container-lowest', 'text-on-surface-variant');
        }
      });
      currentFilter = 'all';
      filterTopics();
    });

    // Kết nối lấy danh mục chủ đề từ Backend Spring Boot
    fetch('http://localhost:5228/api/v1/topics')
      .then(res => res.json())
      .then(data => {
        if (data && data.status === 200 && Array.isArray(data.data)) {
          console.log(`[Web Screen 07] Đã kết nối Backend, tải ${data.data.length} chủ đề.`);
          if (indicator) {
            indicator.textContent = `${data.data.length} chủ đề thường ngày (Database)`;
          }
        }
      })
      .catch(err => {
        console.warn('[Web Screen 07] Không thể kết nối Backend:', err.message);
      });
  })();

});
