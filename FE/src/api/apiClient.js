import { Platform, NativeModules } from 'react-native';

const LAN_IP = '192.168.0.106';

// Tự động phân giải các địa chỉ IP của Backend theo môi trường
function getCandidateBaseUrls() {
  const list = [];

  // 1. Web browser trên máy tính
  if (Platform.OS === 'web') {
    list.push('http://localhost:5228/api/v1');
    list.push(`http://${LAN_IP}:5228/api/v1`);
    return list;
  }

  // 2. Lấy host IP tự động từ Metro Bundler (Expo scriptURL) khi chạy trên điện thoại
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/https?:\/\/([^:\/]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        list.push(`http://${match[1]}:5228/api/v1`);
      }
    }
  } catch (e) {}

  // 3. Địa chỉ IP LAN thực tế của máy tính
  list.push(`http://${LAN_IP}:5228/api/v1`);

  // 4. Máy ảo Android Emulator
  if (Platform.OS === 'android') {
    list.push('http://10.0.2.2:5228/api/v1');
  }

  // 5. Localhost (iOS Simulator)
  list.push('http://localhost:5228/api/v1');

  return [...new Set(list)];
}

let activeBaseUrl = null;
let currentToken = null;
let currentUser = null;

export const setAuthToken = (token) => {
  currentToken = token;
};

export const getAuthToken = () => currentToken;

export const setCurrentUser = (user) => {
  currentUser = user;
};

export const getCurrentUser = () => currentUser;

export const clearAuth = () => {
  currentToken = null;
  currentUser = null;
};

// Hàm gửi request tiện ích với cơ chế tự động tìm máy chủ Backend
async function request(endpoint, options = {}) {
  const candidates = activeBaseUrl ? [activeBaseUrl] : getCandidateBaseUrls();
  let lastError = null;

  for (const base of candidates) {
    const url = `${base}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    };

    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }

      if (!response.ok) {
        // Lỗi từ Backend (400, 401, 403, 500) -> URL này kết nối được
        activeBaseUrl = base;
        const errorMessage = data?.message || `Lỗi HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      // Kết nối thành công, ghim lại base URL
      activeBaseUrl = base;
      return data;
    } catch (error) {
      lastError = error;

      // Nếu là lỗi nghiệp vụ (như sai pass, trùng email), ném lỗi ngay lập tức
      const isNetworkError =
        error.name === 'AbortError' ||
        error.message?.includes('Network') ||
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('Network request failed');

      if (!isNetworkError) {
        throw error;
      }

      console.warn(`[API] Không kết nối được ${url}:`, error.message);
    }
  }

  throw (
    lastError ||
    new Error('Không thể kết nối đến máy chủ Backend (http://192.168.0.106:5228). Vui lòng đảm bảo điện thoại và máy tính chung một mạng WiFi.')
  );
}

// 1. API Đăng Nhập
export async function apiLogin(email, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (res?.data?.accessToken) {
    setAuthToken(res.data.accessToken);
    setCurrentUser(res.data.user);
  }

  return res;
}

// 2. API Đăng Ký Tài Khoản
export async function apiRegister(fullName, email, password, phone = '') {
  const res = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password, phone }),
  });

  if (res?.data?.accessToken) {
    setAuthToken(res.data.accessToken);
    setCurrentUser(res.data.user);
  }

  return res;
}

// 3. API Lấy dữ liệu Trang Chủ & Tiến Độ
export async function apiGetDashboard() {
  const res = await request('/dashboard', {
    method: 'GET',
  });
  return res?.data;
}

// 4. API Lấy thông tin tài khoản hiện tại
export async function apiGetMe() {
  const res = await request('/auth/me', {
    method: 'GET',
  });
  if (res?.data) {
    setCurrentUser(res.data);
  }
  return res?.data;
}

// 5. API Cập nhật thông tin tài khoản
export async function apiUpdateProfile(payload) {
  const res = await request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (res?.data) {
    setCurrentUser(res.data);
  }
  return res?.data;
}

// 6. API Lấy danh sách Tất Cả Chủ Đề
export async function apiGetTopics() {
  const res = await request('/topics', {
    method: 'GET',
  });
  return res?.data;
}

// 7. API Lấy chi tiết một Chủ Đề
export async function apiGetTopicDetail(topicId) {
  const res = await request(`/topics/${topicId}`, {
    method: 'GET',
  });
  return res?.data;
}

// 8. API Lấy danh sách Từ Vựng / Ký Hiệu của một Chủ Đề
export async function apiGetTopicSigns(topicId) {
  const res = await request(`/topics/${topicId}/signs`, {
    method: 'GET',
  });
  return res?.data;
}

// 9. API Lấy danh sách Ký Hiệu (tìm kiếm/lọc)
export async function apiGetAllSigns(search = '', topicId = null) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (topicId) params.append('topicId', topicId);
  const queryStr = params.toString() ? `?${params.toString()}` : '';

  const res = await request(`/signs${queryStr}`, {
    method: 'GET',
  });
  return res?.data;
}

// 10. API Lấy chi tiết một Ký Hiệu
export async function apiGetSignDetail(signId) {
  const res = await request(`/signs/${signId}`, {
    method: 'GET',
  });
  return res?.data;
}

// 11. API Gửi kết quả luyện tập AI Camera
export async function apiSubmitPractice(signId, data) {
  const res = await request(`/signs/${signId}/practice`, {
    method: 'POST',
    body: JSON.stringify({
      signId,
      inputMode: data.inputMode || 'camera',
      predictedLabel: data.predictedLabel,
      confidence: data.confidence || 0.95,
      isCorrect: data.isCorrect ?? true,
    }),
  });
  return res?.data;
}

// 12. API Cập nhật tiến độ học ký hiệu
export async function apiUpdateSignProgress(signId, status, masteryScore = 100) {
  const res = await request(`/signs/${signId}/progress`, {
    method: 'POST',
    body: JSON.stringify({
      signId,
      status, // 'unlearned' | 'review' | 'mastered'
      masteryScore,
    }),
  });
  return res?.data;
}
