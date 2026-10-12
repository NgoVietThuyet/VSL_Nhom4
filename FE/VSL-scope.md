# Phạm vi Chức năng theo Giai đoạn (VSL-Scope)

> **Dự án:** Hệ thống học và thực hành Ngôn ngữ ký hiệu Việt Nam (VSL)  
> **Tài liệu tham chiếu:** Báo cáo tiến độ BTL Nhóm 4, `VSL-DB.md`, `VSL-phase.md`  
> **Phiên bản:** 1.0.0

---

## 1. Ma trận Phân định Phạm vi Chức năng (Scope Matrix)

Bảng tổng hợp phạm vi thực hiện của từng module và chức năng xuyên suốt 3 giai đoạn:

| STT | Phân hệ / Module | Tính năng chi tiết | Phase 1 (Nền tảng & Web MVP) | Phase 2 (Mobile & AI Hoàn thiện) | Phase 3 (Mở rộng & Hoàn thiện BTL) |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **1** | **Xác thực & Người dùng** | Đăng ký / Đăng nhập (JWT) | **Bắt buộc (Web)** | **Tích hợp Mobile** | Duy trì |
| | | Phân quyền `STUDENT` & `ADMIN` | **Bắt buộc** | Tối ưu | Duy trì |
| | | Quên mật khẩu qua Email (OTP) | *Chưa làm* | Khuyến khích | Hoàn thiện |
| **2** | **Quản lý Nội dung** | Xem danh mục chủ đề (`TOPICS`) | **10 Chủ đề cơ bản** | Đầy đủ chủ đề | Đầy đủ chủ đề |
| | | Xem chi tiết từ vựng & Video mẫu | **10–20 Ký hiệu mẫu** | **50–100 Ký hiệu** | **Toàn bộ 400 từ VSL** |
| | | Quản trị viên CRUD Chủ đề/Ký hiệu | **Giao diện Web Admin cơ bản** | Hoàn thiện Web Admin | Tối ưu trải nghiệm |
| **3** | **Thực hành AI** | Nhận diện ký hiệu qua Video Upload | **Bắt buộc (Web)** | Hỗ trợ Mobile | Hỗ trợ Mobile |
| | | Nhận diện cử chỉ trực tiếp (Webcam) | **Bắt buộc (Web)** | **Tối ưu Real-time** | Tối ưu Real-time |
| | | Nhận diện trên Mobile Camera | *Chưa làm* | **Bắt buộc (Android)** | Hỗ trợ thêm iOS |
| | | Loại cử chỉ nhận diện | **Ký hiệu đơn lẻ (Isolated)** | **Ký hiệu đơn lẻ (Isolated)** | **Nghiên cứu câu liên tục (CSLR)** |
| | | Số lượng nhãn AI nhận diện | **10–20 Ký hiệu demo** | **50–100 Ký hiệu** | **Mở rộng theo bộ VSL400** |
| **4** | **Kiểm tra Trắc nghiệm** | Làm bài kiểm tra video theo chủ đề | **Bắt buộc (Web)** | **Tích hợp Mobile** | Duy trì |
| | | Sinh câu hỏi ngẫu nhiên & Chấm điểm | **Bắt buộc** | Hoàn thiện | Duy trì |
| | | Xem lại chi tiết từng câu sai | *Chưa làm* | Khuyến khích | Hoàn thiện |
| **5** | **Tiến độ & Đánh giá** | Ghi nhận lịch sử làm bài & Thực hành | **Bắt buộc (CSDL)** | **Bắt buộc (CSDL)** | Duy trì |
| | | Tính điểm thành thạo (`mastery_score`)| Công thức cơ bản | **Công thức kết hợp AI** | Báo cáo chi tiết |
| | | Biểu đồ trực quan tiến độ học tập | Bảng thống kê thô | **Biểu đồ trực quan** | Gamification (Huy hiệu/Chuỗi ngày) |
| **6** | **Nền tảng Hỗ trợ** | Web Browser (Chrome, Edge) | **Ưu tiên số 1** | Duy trì | Duy trì |
| | | Mobile Android (React Native) | *Chưa hỗ trợ* | **Ưu tiên số 1** | Tối ưu hiệu năng |
| | | Mobile iOS | *Chưa hỗ trợ* | Xem xét (nếu có Mac) | Hoàn thiện cấu hình |

---

## 2. Chi tiết Phạm vi theo Từng Giai đoạn

---

### GIAI ĐOẠN 1 (PHASE 1): Nền tảng, Core Backend & Web MVP Demo

#### 2.1. Trong phạm vi (In-Scope)
* **Phạm vi CSDL:** 
  - Khởi tạo đầy đủ 6 bảng cốt lõi trên SQL Server: `USERS`, `TOPICS`, `SIGNS`, `LEARNING_PROGRESS`, `QUIZ_ATTEMPTS`, `PRACTICE_ATTEMPTS`.
  - Khởi tạo dữ liệu mẫu (Seed Data) cho 10 chủ đề và tối thiểu 10–20 ký hiệu có video thực tế.
* **Phạm vi Backend:**
  - REST API xác thực người dùng bằng Spring Security 6 và JWT.
  - CRUD cơ bản cho danh mục chủ đề và ký hiệu từ vựng.
  - API lưu lịch sử bài thi trắc nghiệm và lịch sử thực hành AI.
  - Tích hợp gọi REST API trung gian sang AI Python Service.
* **Phạm vi Frontend (Web ưu tiên):**
  - Màn hình Đăng nhập / Đăng ký.
  - Trang chủ hiển thị danh sách chủ đề học tập.
  - Trang chi tiết ký hiệu có trình phát video mẫu và hướng dẫn chuyển động.
  - Giao diện làm bài kiểm tra trắc nghiệm 4 lựa chọn có tính điểm.
  - Giao diện bật Webcam/Tải file video để gửi sang AI nhận diện và hiển thị kết quả Đúng/Sai.
* **Phạm vi AI:**
  - Sử dụng thư viện MediaPipe Hands để trích xuất 21 điểm mốc tọa độ bàn tay.
  - Huấn luyện mô hình cơ bản (Bi-LSTM / GRU) nhận diện được tối thiểu 10–20 từ vựng ký hiệu đơn lẻ thường dùng (Chào, Cảm ơn, Tạm biệt, Xin lỗi, số đếm từ 1–10,...).
  - Độ chính xác (Accuracy) trên tập kiểm thử đạt $\ge 80\%$.

#### 2.2. Ngoài phạm vi (Out-of-Scope của Phase 1)
* Không triển khai trên ứng dụng di động native (chưa yêu cầu build APK Android hoặc iOS).
* Không nhận diện câu ký hiệu liên tục (chỉ nhận diện từ/ký hiệu đơn lẻ).
* Không xử lý trường hợp hai tay che khuất nhau phức tạp hoặc ký hiệu phụ thuộc vào chuyển động nét mặt (Facial expression).
* Chưa có chức năng gửi email quên mật khẩu thực tế (dùng mock hoặc đổi mật khẩu trực tiếp qua API).

---

### GIAI ĐOẠN 2 (PHASE 2): Hoàn thiện AI Nhận diện Ký hiệu Đơn & Phát triển Mobile App

#### 2.1. Trong phạm vi (In-Scope)
* **Phạm vi Dữ liệu & AI:**
  - Mở rộng tập dữ liệu từ vựng nhận diện lên 50–100 từ, định hướng mở rộng toàn bộ tập VSL400.
  - Tối ưu mô hình AI giảm kích thước (model quantization) và tối ưu độ trễ suy luận.
  - Cơ chế nhận diện phản hồi liên tục (Real-time Feedback) qua kỹ thuật cửa sổ trượt (Sliding Window) 30 khung hình.
* **Phạm vi Ứng dụng Di động (Mobile App - React Native):**
  - Build ứng dụng chạy trực tiếp trên thiết bị Android thật (kết nối qua cáp USB hoặc quét mã Expo Go).
  - Truy cập Camera điện thoại mượt mà, tích hợp SafeArea không bị che khuất viền màn hình và tai thỏ.
  - Giao diện đồng bộ trạng thái học tập từ Backend qua API.
* **Phạm vi Nghiệp vụ Học tập:**
  - Tự động tính toán điểm thành thạo `mastery_score` và cập nhật trạng thái `status = 'mastered'` khi học viên đạt chuẩn.
  - Màn hình thống kê biểu đồ tiến độ học tập của người dùng.

#### 2.2. Ngoài phạm vi (Out-of-Scope của Phase 2)
* Chưa hỗ trợ nhận diện câu ngữ pháp phức tạp có cấu trúc đảo ngữ đặc thù của người khiếm thính.
* Chưa hỗ trợ chế độ học ngoại tuyến (Offline Mode - chạy AI hoàn toàn cục bộ trên điện thoại không cần mạng).
* Chưa tích hợp cổng thanh toán hoặc hệ thống diễn đàn trao đổi phức tạp giữa các học viên.

---

### GIAI ĐOẠN 3 (PHASE 3): Mở rộng Nhận diện Câu Liên tục, Đánh giá Người dùng & Hoàn thiện BTL

#### 2.1. Trong phạm vi (In-Scope)
* **Phạm vi Nghiên cứu AI Mở rộng:**
  - Nghiên cứu mô hình mạng nhận diện chuỗi cử chỉ liên tục (Continuous Sign Language Recognition - CSLR) cho 5–10 mẫu câu giao tiếp cơ bản (2–4 ký hiệu/câu).
  - Kết hợp giải mã chuỗi với giải thuật CTC (Connectionist Temporal Classification).
* **Phạm vi Kiểm thử & Đánh giá:**
  - Kiểm thử hiệu năng hệ thống: đo thời gian phản hồi API và AI Inference Time (mục tiêu $< 500\text{ms}$).
  - Đánh giá độ khả dụng (Usability Evaluation) theo thang đo SUS dựa trên phản hồi của sinh viên/người dùng trải nghiệm thử nghiệm.
* **Phạm vi Bàn giao Bài tập lớn (BTL Delivery):**
  - Đóng gói trọn bộ mã nguồn Frontend (Web + Mobile), Backend Spring Boot, AI Service FastAPI.
  - Tài liệu báo cáo hoàn chỉnh (Báo cáo tổng kết dự án, slide thuyết trình, video demo sản phẩm).

#### 2.2. Ngoài phạm vi (Out-of-Scope của Dự án BTL)
* Ứng dụng dịch thuật hai chiều từ giọng nói/văn bản sang ký hiệu 3D Avatar (Text-to-Sign 3D Animation).
* Hệ thống nhận diện mở rộng cho các phương ngữ ký hiệu vùng miền khác nhau (miền Bắc, miền Trung, miền Nam).

---

## 3. Tiêu chí Nghiệm thu (Acceptance Criteria)

### 3.1. Tiêu chí Nghiệm thu Phase 1 (MVP Demo)
1. CSDL khởi tạo đầy đủ 6 bảng, không bị lỗi ràng buộc khóa ngoại.
2. Đăng ký tài khoản mới, đăng nhập thành công và lưu trữ JWT.
3. Xem được danh mục bài học và phát được video hướng dẫn ký hiệu mẫu.
4. Bật được webcam hoặc tải lên video cử chỉ, hệ thống trả về kết quả dự đoán kèm độ tin cậy từ AI Service trong vòng dưới 2 giây.
5. Thực hiện bài thi trắc nghiệm và kết quả được lưu chính xác vào bảng `QUIZ_ATTEMPTS`.

### 3.2. Tiêu chí Nghiệm thu Phase 2 (Mobile & Complete Isolated AI)
1. Ứng dụng React Native cài đặt và chạy được trên điện thoại Android thật.
2. Camera trên điện thoại bắt hình ổn định, hiển thị không bị lỗi layout/tràn màn hình.
3. Mô hình AI nhận diện chính xác ít nhất 50 ký hiệu đơn với độ chính xác kiểm nghiệm đạt $\ge 85\%$.
4. Màn hình hồ sơ cá nhân hiển thị trực quan tỷ lệ hoàn thành bài học và điểm thành thạo.

### 3.3. Tiêu chí Nghiệm thu Phase 3 (Bảo vệ BTL)
1. Hoàn thành kịch bản demo trực tiếp các luồng học tập và thực hành cử chỉ trước hội đồng chấm BTL.
2. Thuyết minh rõ ràng kiến trúc hệ thống, sơ đồ CSDL và giải pháp nhận diện AI.
3. Đạt yêu cầu về tài liệu kỹ thuật, báo cáo và mã nguồn sạch, có thể tái dựng (reproducible) qua Docker hoặc tài liệu hướng dẫn chạy.
