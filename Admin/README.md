# VSL Admin Portal — Cổng Quản Trị Hệ Thống Học Ngôn Ngữ Ký Hiệu

> **Dự án:** Hệ thống học và thực hành Ngôn ngữ ký hiệu Việt Nam (VSL) — BTL Nhóm 4  
> **Thư mục:** `d:\ky1nam4\TTNM\admin\`  
> **Kiến trúc:** Angular 20 Standalone Components, Ng-Zorro Ant Design theme (#189AD6), Bootstrap Icons  
> **Backend:** Spring Boot (Port 5228) · SQL Server  

---

## 1. Tài khoản Quản trị viên Mặc định

- **Tài khoản:** `admin` (hoặc `admin@vsl.edu.vn`)
- **Mật khẩu:** `admin@123`
- **Vai trò:** `ADMIN`

---

## 2. Hướng dẫn Khởi chạy Admin Portal

### Bước 1: Khởi động Backend Spring Boot (nếu chưa chạy)
```powershell
cd d:\ky1nam4\TTNM\BE
.\gradlew.bat bootRun
```
*Backend chạy tại `http://localhost:5228`.*

### Bước 2: Khởi động Admin Portal
```powershell
cd d:\ky1nam4\TTNM\admin
npm start
```
*Giao diện Admin chạy tại `http://localhost:4300`.*

---

## 3. Các thành phần đã triển khai trong Module 1 (Dashboard & Analytics)

1. **Khung kiến trúc Admin (Phase A1 Foundation):**
   - Cấu trúc Angular 20 độc lập trong `admin/` kế thừa `node_modules` và style từ `2.FrontEnd`.
   - Layout Admin với Sidebar điều hướng 7 Module, Top Header hiển thị tài khoản Admin và nút Đăng xuất.
   - `AuthService`, `adminAuthGuard` và `jwtInterceptor` tự động đính kèm Bearer Token vào mọi request.
   - Trang Đăng nhập (`/login`) với tài khoản mặc định `admin` / `admin@123`.

2. **Dashboard & Analytics (Module 1):**
   - **6 Thẻ KPI Thời gian thực:** Tổng học viên, Chuỗi ngày học hoạt động hôm nay, Tổng chủ đề, Tổng ký hiệu từ vựng, Lượt luyện AI hôm nay, Độ chuẩn xác AI trung bình.
   - **Biểu đồ Tần suất Hoạt động 7 Ngày:** Trực quan hóa số lượt thực hành AI Camera và bài thi Quiz.
   - **Biểu đồ Phân bổ Cấp độ:** Thống kê tỷ lệ học viên theo cấp bậc (Cấp 1 đến Cấp 5+).
   - **Thống kê Luyện tập theo 8 Chủ đề:** Thanh tiến độ số lượt học từng chủ đề.
   - **Bảng Xếp Hạng Học Viên (Leaderboard):** Top học viên có điểm kinh nghiệm (XP) cao nhất.
   - **Nhật ký Hoạt động (Activity Feed):** Sự kiện thực hành, đạt danh hiệu và hoàn thành quiz gần nhất.

3. **Backend API hỗ trợ Module 1:**
   - `POST /api/v1/auth/login`: Xác thực tài khoản Admin, cấp JWT Token với quyền `ROLE_ADMIN`.
   - `GET /api/v1/admin/stats/dashboard`: Truy vấn và tổng hợp toàn bộ số liệu thống kê từ CSDL SQL Server.
