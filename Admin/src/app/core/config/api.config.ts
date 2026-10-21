/**
 * Địa chỉ Backend. Mặc định http://localhost:5228; khi cần trỏ sang server khác (VD chạy thử ở cổng khác)
 * đặt localStorage 'admin_api_origin' = 'http://localhost:5230' rồi tải lại trang.
 */
function resolveApiOrigin(): string {
  try {
    return localStorage.getItem('admin_api_origin') || 'http://localhost:5228';
  } catch {
    return 'http://localhost:5228';
  }
}

export const API_BASE = resolveApiOrigin() + '/api/v1';
