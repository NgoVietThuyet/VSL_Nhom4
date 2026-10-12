# Phạm vi Chức năng theo Giai đoạn (VSL-Scope)
### Gắn liền với 8 Màn hình Giao diện & Kiến trúc Frontend Hiện có

> **Dự án:** Hệ thống học và thực hành Ngôn ngữ ký hiệu Việt Nam (VSL) - BTL Nhóm 4  
> **Căn cứ xác định phạm vi:** 8 Màn hình UI trong Web Screen Portal [`screens/`](file:///d:/ky1nam4/TTNM/FE/screens/) và Mobile App [`src/screens/`](file:///d:/ky1nam4/TTNM/FE/src/screens/), tài liệu [`VSL-DB.md`](file:///d:/ky1nam4/TTNM/FE/VSL-DB.md) và [`VSL-phase.md`](file:///d:/ky1nam4/TTNM/FE/VSL-phase.md).

---

## 1. Ma trận Phân định Phạm vi theo 8 Màn hình Frontend (Screen Scope Matrix)

Bảng phân bổ trạng thái chuyển đổi từ Giao diện Mockup sang Tính năng Hoạt động Thật xuyên suốt 3 giai đoạn:

| STT | Màn hình Frontend | File Thành phần FE | Phase 1 (Nền tảng & Web MVP) | Phase 2 (Camera Thật & AI Core) | Phase 3 (Mở rộng 400 Từ & BTL) |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **01** | **Kiểm Tra Kiến Thức Quiz** | `screens/01_kiem_tra_quiz`<br/>[`src/screens/QuizScreen.js`](file:///d:/ky1nam4/TTNM/FE/src/screens/QuizScreen.js) | **Chuyển sang API thật**<br/>• Làm 3 câu hỏi mẫu<br/>• Lưu điểm vào `QUIZ_ATTEMPTS` | **Mở rộng bộ câu hỏi**<br/>• Sinh ngẫu nhiên theo chủ đề<br/>• Đếm ngược thời gian làm bài | **Hoàn thiện**<br/>• Phân tích câu sai<br/>• Tối ưu chuyển cảnh mượt mà |
| **02** | **Chi Tiết Chủ Đề Bài Học** | `screens/02_chi_tiet_chu_de_chao_hoi`<br/>[`src/screens/TopicDetailScreen.js`](file:///d:/ky1nam4/TTNM/FE/src/screens/TopicDetailScreen.js) | **Chuyển sang API thật**<br/>• Hiển thị 5 từ mẫu chủ đề 1<br/>• Lọc theo tab trạng thái | **Mở rộng dữ liệu**<br/>• Đầy đủ từ vựng của 8 chủ đề<br/>• Cập nhật badge hoàn thành | **Hoàn thiện**<br/>• Đồng bộ tiến độ offline/online |
| **03** | **Phòng Thực Hành AI Camera** | `screens/03_phong_thuc_hanh_ai_camera`<br/>[`src/screens/AICameraScreen.js`](file:///d:/ky1nam4/TTNM/FE/src/screens/AICameraScreen.js) | *Giữ nguyên Mockup UI*<br/>• Dùng ảnh mẫu và SVG tĩnh<br/>• Thử nghiệm API AI qua web | **Kích hoạt Camera Thật**<br/>• Tích hợp Expo Camera<br/>• Vẽ 21 Landmarks thời gian thực<br/>• Chấm điểm 10–20 từ đơn | **Mở rộng AI Nâng cao**<br/>• Nhận diện 50–100 từ<br/>• Nghiên cứu nhận diện chuỗi câu (`phrases`) |
| **04** | **Đăng Nhập Tài Khoản** | `screens/04_dang_nhap_tai_khoan`<br/>[`src/screens/LoginScreen.js`](file:///d:/ky1nam4/TTNM/FE/src/screens/LoginScreen.js) | **Chuyển sang API thật**<br/>• Đăng nhập với Spring Security<br/>• Cấp phát và lưu JWT Token | **Bổ sung Đăng ký**<br/>• Đăng ký tài khoản mới<br/>• Tự động đăng nhập lưu phiên | **Hoàn thiện Bảo mật**<br/>• Refresh Token tự động<br/>• Đổi mật khẩu cá nhân |
| **05** | **Hồ Sơ Cá Nhân & Thành Tích** | `screens/05_ho_so_ca_nhan_thanh_tich`<br/>[`src/screens/ProfileScreen.js`](file:///d:/ky1nam4/TTNM/FE/src/screens/ProfileScreen.js) | **Chuyển sang API thật**<br/>• Lấy thông tin user đăng nhập<br/>• Hiển thị số liệu từ CSDL | **Đồng bộ Điểm AI**<br/>• Tự động tính độ chuẩn AI<br/>• Cập nhật điểm kinh nghiệm XP | **Mở rộng Gamification**<br/>• Mở khóa đầy đủ huy hiệu<br/>• Bảng xếp hạng học viên |
| **06** | **Chi Tiết Ký Hiệu** | `screens/06_chi_tiet_ky_hieu`<br/>[`src/screens/SignDetailScreen.js`](file:///d:/ky1nam4/TTNM/FE/src/screens/SignDetailScreen.js) | **Chuyển sang API thật**<br/>• Stream video mẫu từ URL<br/>• Parse JSON các bước thực hiện<br/>• Nút bấm mở màn hình AI | **Tối ưu Trình phát Video**<br/>• Điều khiển tốc độ 0.5x, 0.75x<br/>• Đánh dấu từ yêu thích | **Hoàn thiện**<br/>• Cache video xem mượt mà |
| **07** | **Danh Mục Chủ Đề** | `screens/07_danh_muc_chu_de`<br/>[`src/screens/TopicsScreen.js`](file:///d:/ky1nam4/TTNM/FE/src/screens/TopicsScreen.js) | **Chuyển sang API thật**<br/>• Hiển thị 8 thẻ chủ đề động<br/>• Lọc theo 4 cấp độ bài học | **Tự động tính Tiến độ**<br/>• Hiển thị phần trăm chính xác<br/>• Mở khóa chủ đề tuần tự | **Hoàn thiện**<br/>• Gợi ý chủ đề tiếp theo |
| **08** | **Trang Chủ & Tiến Độ** | `screens/08_trang_chu_tien_do`<br/>[`src/screens/HomeScreen.js`](file:///d:/ky1nam4/TTNM/FE/src/screens/HomeScreen.js) | **Chuyển sang API thật**<br/>• Header hiển thị tên & avatar<br/>• Thẻ chủ đề đang học gần nhất<br/>• Danh sách từ cần ôn tập | **Đồng bộ Streak**<br/>• Tự động tính chuỗi ngày học<br/>• Nút tắt vào phòng AI Camera | **Hoàn thiện Toàn diện**<br/>• Tối ưu hiệu năng cuộn mượt |

---

## 2. Chi tiết Phạm vi Công việc (In-Scope vs. Out-of-Scope)

---

### GIAI ĐOẠN 1 (PHASE 1): Nền tảng, Core Backend & Web MVP Demo

#### 2.1. Trong phạm vi (In-Scope)
* **Phạm vi CSDL:** 
  - Khởi tạo đầy đủ 6 bảng trên SQL Server theo cấu trúc đồng bộ với FE tại [`VSL-DB.md`](file:///d:/ky1nam4/TTNM/FE/VSL-DB.md).
  - Nạp dữ liệu Seed Data cho 8 chủ đề (từ `TOPICS` trong [`mockData.js`](file:///d:/ky1nam4/TTNM/FE/src/data/mockData.js)) và 5 từ vựng mẫu đầu tiên ("Xin chào", "Cảm ơn", "Tạm biệt", "Rất vui được gặp bạn", "Xin lỗi").
* **Phạm vi Backend (Spring Boot):**
  - Cung cấp các API: Đăng nhập/Đăng ký JWT, Danh sách chủ đề, Chi tiết ký hiệu, Nộp bài thi trắc nghiệm.
* **Phạm vi Frontend:**
  - Chuyển đổi các màn hình Màn 04 (`LoginScreen`), Màn 08 (`HomeScreen`), Màn 07 (`TopicsScreen`), Màn 02 (`TopicDetailScreen`), Màn 06 (`SignDetailScreen`), Màn 01 (`QuizScreen`) sang nhận dữ liệu từ API thay vì `mockData.js`.
  - Giữ nguyên Web Screen Portal ([`screens/index.html`](file:///d:/ky1nam4/TTNM/FE/screens/index.html)) làm cổng trình diễn các màn hình trên trình duyệt.
* **Phạm vi AI:**
  - Trên màn [`AICameraScreen.js`](file:///d:/ky1nam4/TTNM/FE/src/screens/AICameraScreen.js), tạm thời duy trì giao diện mô phỏng (Mockup SVG) để phục vụ luồng UI demo, song song xây dựng dịch vụ FastAPI kiểm thử trên máy tính qua webcam hoặc upload video.

#### 2.2. Ngoài phạm vi (Out-of-Scope của Phase 1)
* Chưa nhúng camera phần cứng thực tế vào mã nguồn React Native.
* Chưa phân tích cử chỉ trực tiếp trên điện thoại.
* Chưa áp dụng cơ chế mở khóa bài học có điều kiện (tất cả các chủ đề đều có thể bấm vào xem thử).

---

### GIAI ĐOẠN 2 (PHASE 2): Kích hoạt Camera Thật & Pipeline AI Cốt lõi

#### 2.1. Trong phạm vi (In-Scope)
* **Phạm vi Mobile Native & Camera:**
  - Kích hoạt Camera phần cứng trên thiết bị Android thật trong [`AICameraScreen.js`](file:///d:/ky1nam4/TTNM/FE/src/screens/AICameraScreen.js) qua thư viện `expo-camera`.
  - Đảm bảo hiển thị chuẩn xác không bị tràn viền, hỗ trợ đổi camera trước/sau.
* **Phạm vi Trực quan hóa & AI:**
  - Cập nhật [`HandLandmarksSVG.js`](file:///d:/ky1nam4/TTNM/FE/src/components/HandLandmarksSVG.js) nhận tọa độ động từ kết quả nhận diện của MediaPipe.
  - Nhận diện chuẩn xác 10–20 ký hiệu cử chỉ đơn lẻ thông dụng trong giao tiếp với độ chính xác $\ge 85\%$.
  - Cập nhật tức thời kết quả đánh giá vào CSDL `PRACTICE_ATTEMPTS` và hiển thị trên [`ProfileScreen.js`](file:///d:/ky1nam4/TTNM/FE/src/screens/ProfileScreen.js).

#### 2.2. Ngoài phạm vi (Out-of-Scope của Phase 2)
* Chưa nhận diện chuỗi câu dài liên tục (vẫn tập trung hoàn thiện cử chỉ từ đơn).
* Chưa hỗ trợ biên dịch cử chỉ không có kết nối internet (chưa có mô hình Edge AI offline trên máy).

---

### GIAI ĐOẠN 3 (PHASE 3): Mở rộng Toàn diện Bộ Từ vựng, Nhận diện Câu & Đóng gói BTL

#### 2.1. Trong phạm vi (In-Scope)
* **Phạm vi Dữ liệu & AI Mở rộng:**
  - Mở rộng ngân hàng từ vựng trong CSDL lên 400 ký hiệu đơn (theo bộ dữ liệu VSL400).
  - Nghiên cứu mô hình nhận diện chuỗi câu ngắn 2–3 từ (`category = 'phrases'`) với thuật toán CTC Loss.
* **Phạm vi Đóng gói & Bàn giao:**
  - Build file cài đặt `.apk` cho Android để trình diễn trực tiếp trên điện thoại của sinh viên trong buổi bảo vệ.
  - Hoàn thiện toàn bộ 8 màn hình không còn lỗi hiển thị hay dữ liệu giả lập.
  - Hoàn thiện Báo cáo tổng kết Bài tập lớn và Video Demo.

#### 2.2. Ngoài phạm vi của Đề tài BTL
* Xây dựng Avatar 3D mô phỏng cử chỉ ngược lại từ văn bản sang ký hiệu (Text-to-Sign Animation).
* Hệ thống nhận diện mở rộng cho các phương ngữ ký hiệu địa phương (Hà Nội, Hải Phòng, TP.HCM).

---

## 3. Tiêu chí Nghiệm thu theo Từng Màn hình (Screen Acceptance Criteria)

| Màn hình | Tiêu chí Nghiệm thu Phase 1 | Tiêu chí Nghiệm thu Phase 2 | Tiêu chí Nghiệm thu Phase 3 |
| :--- | :--- | :--- | :--- |
| **04. Đăng nhập** | Nhập email/pass đúng $\to$ Lưu JWT $\to$ Tự động vào Trang chủ. | Báo lỗi chuẩn khi sai mật khẩu; Lưu trạng thái phiên làm việc. | Tự động gia hạn Token; Mã hóa thông tin an toàn. |
| **08. Trang chủ** | Hiển thị đúng tên học viên và chủ đề đang học từ API. | Chuỗi ngày học (`streakDays`) tự động tăng khi hoàn thành bài học trong ngày. | Tốc độ tải dữ liệu $< 300\text{ms}$; Cuộn trang mượt mà 60fps. |
| **07. Danh mục** | Hiển thị 8 thẻ chủ đề; Lọc chính xác theo 4 tab cấp độ. | Thanh tiến độ trên từng thẻ hiển thị % từ đã thuần thục thật sự. | Tìm kiếm từ khóa tức thì không bị giật lag. |
| **02. Chi tiết chủ đề** | Bấm vào chủ đề 1 mở đúng danh sách từ vựng từ CSDL. | Badge trạng thái (Thuần thục, Cần ôn, Chưa học) đổi màu chuẩn xác. | Nút "Làm bài kiểm tra" chuyển mượt sang màn Quiz chủ đề. |
| **06. Chi tiết từ** | Phát được video mẫu; Hiển thị danh sách các bước cử chỉ. | Điều khiển được tốc độ phát video (0.5x, 0.75x, 1x). | Cache video giúp mở lại không cần tải lại toàn bộ. |
| **03. Phòng AI Camera** | Màn hình mô phỏng hiển thị đúng layout và các nút chức năng. | Camera máy thật hoạt động; Khung xương bàn tay bám theo tay người học; Chấm điểm chính xác. | Thời gian phản hồi kết quả AI $< 500\text{ms}$; Tỷ lệ nhận diện đạt $\ge 88\%$. |
| **01. Quiz** | Chọn đáp án có phản hồi Đúng/Sai; Lưu điểm vào CSDL. | Bộ câu hỏi lấy ngẫu nhiên từ CSDL; Hiển thị giải thích chi tiết. | Bảng tổng kết hiển thị chuẩn số câu đúng và điểm số đạt được. |
| **05. Hồ sơ cá nhân** | Hiển thị thông tin cá nhân và số liệu cơ bản từ CSDL. | Số từ thuần thục và điểm chuẩn AI khớp với lịch sử thực hành thật. | Mở khóa huy hiệu thành tích khi học viên đạt đủ tiêu chuẩn. |
