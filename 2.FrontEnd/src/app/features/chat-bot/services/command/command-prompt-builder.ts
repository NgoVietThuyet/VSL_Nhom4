import { MenuContext, UiActionContext, UiActionId } from '../../models/command.model';

/**
 * Helpers for normalizing input and preparing LLM context.
 * Pure functions only — no Angular dependencies.
 */

/** Aliases for common Workspace menus. Used to enrich the user-permitted menu list. */
export const MENU_ALIASES: Record<string, string[]> = {
  '/home':           ['trang chủ', 'dashboard', 'home', 'main', 'overview', 'tổng quan'],
  '/mail':           ['mail', 'email', 'thư', 'hộp thư', 'thư điện tử', 'inbox', 'kiểm tra mail', 'kiểm tra email', 'mở mail', 'mở hộp thư'],
  '/calendar':       ['lịch', 'calendar', 'lịch làm việc', 'lịch hôm nay', 'agenda', 'schedule'],
  '/task':           ['công việc', 'task', 'tasks', 'nhiệm vụ', 'todo', 'quản lý công việc', 'việc cần làm'],
  '/chat':           ['chat', 'trò chuyện', 'tin nhắn', 'messages', 'nhắn tin'],
  '/chat-bot':       ['chat bot', 'chatbot', 'trợ lý ai', 'ai assistant', 'ai'],
  '/notes':          ['ghi chú', 'notes', 'sổ tay', 'note'],
  '/meeting':        ['họp', 'meeting', 'cuộc họp', 'video call', 'video meeting', 'phòng họp'],
  '/documents':      ['tài liệu', 'documents', 'docs', 'văn bản'],
  '/explorer':       ['quản lý file', 'file', 'files', 'file explorer', 'explorer', 'tệp tin'],
  '/workflow':       ['quy trình', 'workflow', 'luồng công việc'],
  '/crm':            ['crm', 'khách hàng', 'customer'],
  '/gis':            ['gis', 'bản đồ', 'map', 'maps', 'địa lý'],
  '/asset':          ['tài sản', 'asset', 'assets', 'thiết bị'],
  '/hrm':            ['nhân sự', 'hrm', 'hr', 'employee', 'nhân viên'],
  '/report':         ['báo cáo', 'report', 'reports', 'thống kê'],
  '/system-manager': ['quản trị hệ thống', 'system', 'admin', 'cài đặt hệ thống', 'phân quyền'],
  '/master-data':    ['dữ liệu master', 'master data', 'danh mục'],
  '/game':           ['game', 'trò chơi', 'gamification'],
  '/system-monitoring': ['giám sát hệ thống', 'monitoring', 'system monitor']
};

export const UI_ACTION_DEFS: { action: UiActionId; description: string; aliases: string[] }[] = [
  { action: 'minimize_chat',     description: 'Thu nhỏ cửa sổ chat',
    aliases: ['thu nhỏ chat', 'thu nhỏ cửa sổ chat', 'thu gọn chat', 'minimize chat', 'minimize', 'ẩn chat đi', 'thu nhỏ chatbot', 'ẩn chatbot'] },
  { action: 'maximize_chat',     description: 'Phóng to / mở rộng chat',
    aliases: ['phóng to chat', 'mở rộng chat', 'maximize chat', 'expand chat', 'mở chatbot toàn màn hình'] },
  { action: 'close_chat',        description: 'Đóng cửa sổ chat',
    aliases: ['đóng chat', 'tắt chat', 'close chat', 'tắt chatbot', 'đóng chatbot'] },
  { action: 'toggle_sidebar',    description: 'Bật/tắt sidebar / thanh menu chính',
    aliases: ['ẩn menu', 'hiện menu', 'thu menu', 'mở menu', 'ẩn thanh menu', 'hiện thanh menu', 'toggle sidebar', 'thu gọn menu', 'mở rộng menu'] },
  { action: 'enable_dark_mode',  description: 'Bật chế độ tối',
    aliases: ['bật dark mode', 'chế độ tối', 'enable dark mode', 'dark mode on', 'chuyển sang nền tối'] },
  { action: 'disable_dark_mode', description: 'Tắt chế độ tối',
    aliases: ['tắt dark mode', 'chế độ sáng', 'disable dark mode', 'light mode', 'chuyển sang nền sáng'] },
  { action: 'clear_chat',        description: 'Xoá lịch sử / nội dung chat',
    aliases: ['xoá hội thoại', 'xóa hội thoại', 'clear chat', 'xoá lịch sử chat', 'xóa lịch sử chat', 'xoá tin nhắn', 'reset chat'] }
];

const VIETNAMESE_DIACRITICS_MAP: Record<string, string> = {
  'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
  'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
  'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
  'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
  'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
  'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
  'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
  'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
  'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
  'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
  'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
  'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
  'đ': 'd'
};

export function normalizeText(input: string): string {
  if (!input) return '';
  let s = input.toLowerCase().trim();
  // Remove diacritics
  s = s.replace(/[\u00C0-\u024F\u1E00-\u1EFF]/g, ch => VIETNAMESE_DIACRITICS_MAP[ch.toLowerCase()] ?? ch);
  // Strip punctuation
  s = s.replace(/[.,!?;:"'`]/g, ' ');
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

export function detectLanguage(input: string): 'vi' | 'en' | 'auto' {
  if (!input) return 'auto';
  // Vietnamese has diacritics or characters like đ
  if (/[\u00C0-\u024F\u1E00-\u1EFF]|đ/i.test(input)) return 'vi';
  // Pure ASCII heuristic
  if (/^[\x00-\x7F]+$/.test(input)) return 'en';
  return 'auto';
}

/**
 * Levenshtein-based similarity ratio [0..1].
 * Used for fuzzy matching.
 */
export function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const m = a.length;
  const n = b.length;
  if (m === 0 || n === 0) return 0;
  const dp: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : Math.min(prev, dp[j - 1], dp[j]) + 1;
      prev = tmp;
    }
  }
  const dist = dp[n];
  return 1 - dist / Math.max(m, n);
}

/** Enrich user-permitted menus with built-in aliases. */
export function enrichMenusWithAliases(menus: MenuContext[]): MenuContext[] {
  return menus.map(m => {
    const aliasesFromUrl = MENU_ALIASES[m.url?.toLowerCase()] ?? [];
    const combined = [...(m.aliases ?? []), ...aliasesFromUrl];
    // dedupe (case-insensitive)
    const seen = new Set<string>();
    const aliases = combined.filter(a => {
      const k = a.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return { ...m, aliases };
  });
}

export function getDefaultUiActions(): UiActionContext[] {
  return UI_ACTION_DEFS.map(d => ({ action: d.action, description: d.description }));
}

export function getUiActionAliasMap(): Record<UiActionId, string[]> {
  const map = {} as Record<UiActionId, string[]>;
  UI_ACTION_DEFS.forEach(d => { map[d.action] = d.aliases; });
  return map;
}
