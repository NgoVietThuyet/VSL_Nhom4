# VietSign - Ứng Dụng Học Ngôn Ngữ Ký Hiệu Việt Nam (VSL) 🤟

Dự án Frontend được xây dựng hoàn toàn bằng **React Native (Expo)**, chuyển đổi từ 8 màn hình thiết kế gốc của **Stitch (Google)**:

## 📱 Danh Sách 8 Màn Hình (Chuyển đổi từ Stitch sang React Native)

| STT | Màn hình Stitch | Tên Component React Native | Mô tả chi tiết |
| :---: | :--- | :--- | :--- |
| **1** | `04_dang_nhap_tai_khoan` | [`LoginScreen.js`](./src/screens/LoginScreen.js) | Đăng nhập tài khoản, ghi nhớ mật khẩu, đăng nhập sinh trắc học & Google, chế độ trải nghiệm khách. |
| **2** | `08_trang_chu_tien_do` | [`HomeScreen.js`](./src/screens/HomeScreen.js) | Dashboard tiến độ khóa VSL A1, chuỗi học 5 ngày 🔥, vòng đo tiến độ 30%, lối tắt Luyện AI & Quiz ngày. |
| **3** | `07_danh_muc_chu_de` | [`TopicsScreen.js`](./src/screens/TopicsScreen.js) | Danh mục 10 chủ đề VSL, tìm kiếm từ vựng, bộ lọc chip (Cơ bản, Ký hiệu đơn, Câu giao tiếp). |
| **4** | `02_chi_tiet_chu_de_chao_hoi` | [`TopicDetailScreen.js`](./src/screens/TopicDetailScreen.js) | Chi tiết bài học, tiến độ chủ đề (85%), danh sách từ vựng kèm video demo và lối tắt mở camera. |
| **5** | `06_chi_tiet_ky_hieu` | [`SignDetailScreen.js`](./src/screens/SignDetailScreen.js) | Trình phát video cử chỉ chuẩn, phiên âm IPA, tiếng Anh, hướng dẫn 2 bước cốt lõi & mẹo ngữ pháp VSL. |
| **6** | `03_phong_thuc_hanh_ai_camera` | [`AICameraScreen.js`](./src/screens/AICameraScreen.js) | Phòng luyện camera AI POV, mô phỏng khung xương MediaPipe 21 khớp tay (SVG), đo độ chuẩn 94% theo thời gian thực. |
| **7** | `01_kiem_tra_quiz` | [`QuizScreen.js`](./src/screens/QuizScreen.js) | Bài kiểm tra trắc nghiệm 4 lựa chọn, phát lại video câu hỏi, phản hồi tức thì (+25 XP) và màn tổng kết điểm. |
| **8** | `05_ho_so_ca_nhan_thanh_tich` | [`ProfileScreen.js`](./src/screens/ProfileScreen.js) | Hồ sơ học viên, thanh XP lên Cấp 4, Bento grid 4 chỉ số rèn luyện, bộ sưu tập huy hiệu & cài đặt phản hồi rung. |

---

## 🎨 Hệ Thống Design Tokens (Theme)
Toàn bộ màu sắc và khoảng cách được định nghĩa đồng bộ tại [`src/constants/theme.js`](./src/constants/theme.js):
- **Primary Teal:** `#005c55` / `#0f766e` (Màu thương hiệu VietSign)
- **Secondary Orange:** `#9d4300` / `#fd761a` (Điểm nhấn gamification)
- **Tertiary Green:** `#005e3f` / `#007952` (Trạng thái thành công & AI chính xác)
- **Surface / Background:** `#faf8ff` (Nền sáng hiện đại, thân thiện)

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Cài đặt các gói phụ thuộc (Dependencies):
```bash
npm install
```

### 2. Khởi chạy dự án với Expo:
```bash
# Khởi động Expo Metro Bundler
npx expo start

# Hoặc mở trực tiếp trên thiết bị/trình giả lập:
npm run android   # Chạy trên Android Emulator hoặc thiết bị kết nối qua ADB
npm run ios       # Chạy trên iOS Simulator (macOS)
npm run web       # Chạy phiên bản Web
```

Quét mã QR bằng ứng dụng **Expo Go** trên điện thoại (Android / iOS) để trải nghiệm trực tiếp!
