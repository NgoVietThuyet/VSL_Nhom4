export const TASK_LOG_STATUS = {
  getLabel(action: string | null | undefined): string {
    if (!action) return '';
    const labels: Record<string, string> = {
      CREATE: 'Tạo mới nhiệm vụ',
      UPDATE: 'Cập nhật nhiệm vụ',
      DONE: 'Hoàn thành nhiệm vụ',
      DOING: 'Bắt đầu thực hiện',
      ASSIGN_TASK: 'Giao nhiệm vụ',
      REMOVE: 'Xóa nhiệm vụ',
      REQUEST_EXTEND: 'Đề xuất gia hạn',
      APPROVE_EXTEND: 'Phê duyệt gia hạn',
      REJECT_EXTEND: 'Từ chối gia hạn',
      REQUEST_COMPLETE: 'Đề xuất hoàn thành',
      APPROVE_COMPLETE: 'Phê duyệt hoàn thành',
      REJECT_COMPLETE: 'Từ chối hoàn thành',
      REQUEST_PAUSE: 'Đề xuất tạm dừng',
      APPROVE_PAUSE: 'Phê duyệt tạm dừng',
      REJECT_PAUSE: 'Từ chối tạm dừng',
      PAUSE: 'Tạm dừng nhiệm vụ',
      RESUME: 'Tiếp tục nhiệm vụ',
      REQUEST_STOP: 'Đề xuất dừng',
      APPROVE_STOP: 'Phê duyệt dừng',
      REJECT_STOP: 'Từ chối dừng',
      STOP: 'Dừng nhiệm vụ',
      CHANGE_TIME: 'Thay đổi thời hạn',
      COORDINATE_TASK: 'Phối hợp',
      PROGRESS_REPORT_CREATE: 'Gửi báo cáo tiến độ',
      PROGRESS_REPORT_UPDATE: 'Cập nhật báo cáo tiến độ',
      PROGRESS_REPORT_DELETE: 'Xóa báo cáo tiến độ',
    };
    return labels[action] ?? action;
  },

  getDescriptionLabel(action: string | null | undefined): string {
    if (!action) return '';
    const labels: Record<string, string> = {
      REJECT_EXTEND: 'Lý do từ chối',
      REJECT_COMPLETE: 'Lý do từ chối',
      REJECT_PAUSE: 'Lý do từ chối',
      REJECT_STOP: 'Lý do từ chối',
      REQUEST_EXTEND: 'Lý do gia hạn',
      REQUEST_PAUSE: 'Lý do tạm dừng',
      REQUEST_STOP: 'Lý do dừng',
      REQUEST_COMPLETE: 'Báo cáo hoàn thành',
      ASSIGN_TASK: 'Nhiệm vụ',
    };
    return labels[action] ?? '';
  },
} as const;
