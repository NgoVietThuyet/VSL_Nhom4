/**
 * Nhãn hiển thị dùng chung cho mọi trang quản trị — một khái niệm chỉ có một cách gọi.
 *  - Tài khoản người dùng: "Hoạt động" / "Đã khoá"
 *  - Nội dung học (chủ đề, bài học, ký hiệu): "Đang hiển thị" / "Đang ẩn"
 */

export const ACCOUNT_STATUS = {
  activeLabel: 'Hoạt động',
  lockedLabel: 'Đã khoá',
};

export const CONTENT_STATUS = {
  visibleLabel: 'Đang hiển thị',
  hiddenLabel: 'Đang ẩn',
  showAction: 'Hiển thị cho học viên',
  hideAction: 'Ẩn khỏi học viên',
};

export function accountStatusLabel(active: boolean | null | undefined): string {
  return active ? ACCOUNT_STATUS.activeLabel : ACCOUNT_STATUS.lockedLabel;
}

export function contentStatusLabel(visible: boolean | null | undefined): string {
  return visible ? CONTENT_STATUS.visibleLabel : CONTENT_STATUS.hiddenLabel;
}

export const ROLE_OPTIONS = [
  { value: 'STUDENT', label: 'Học viên' },
  { value: 'ADMIN', label: 'Quản trị viên' },
];

export function roleLabel(role: string | null | undefined): string {
  return (role || '').toUpperCase() === 'ADMIN' ? 'Quản trị viên' : 'Học viên';
}

export function isAdminRole(role: string | null | undefined): boolean {
  return (role || '').toUpperCase() === 'ADMIN';
}

/** Phân loại nội dung ký hiệu / chủ đề (giá trị lưu trong CSDL giữ nguyên tiếng Anh). */
export const CONTENT_TYPE_OPTIONS = [
  { value: 'single', label: 'Từ đơn' },
  { value: 'phrases', label: 'Cụm từ / Câu' },
  { value: 'single phrases', label: 'Hỗn hợp' },
];

export function contentTypeLabel(value: string | null | undefined): string {
  return CONTENT_TYPE_OPTIONS.find(o => o.value === value)?.label || value || '—';
}

/** Nhãn loại hoạt động trong bảng "Hoạt động gần đây". */
export function activityTypeLabel(type: string | null | undefined): string {
  switch ((type || '').toUpperCase()) {
    case 'PRACTICE': return 'Luyện AI';
    case 'QUIZ': return 'Quiz';
    case 'REGISTER': return 'Tài khoản';
    default: return type || '';
  }
}

/** Màu thẻ cấp độ chủ đề — cùng cấp luôn cùng màu ở mọi trang. */
export function topicLevelColor(level: string | null | undefined): string {
  switch (level) {
    case 'Nhập môn': return 'green';
    case 'Cơ bản': return 'blue';
    case 'Trung cấp': return 'purple';
    case 'Nâng cao': return 'orange';
    default: return 'default';
  }
}

export function initials(name?: string | null): string {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}
