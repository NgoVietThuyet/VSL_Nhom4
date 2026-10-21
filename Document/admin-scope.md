# Phạm vi Agent theo Module Admin — VSL Admin Portal

> **Dự án:** Hệ thống học và thực hành Ngôn ngữ ký hiệu Việt Nam (VSL) — BTL Nhóm 4  
> **Tài liệu này xác định:** Với mỗi module/submodule/chức năng, agent được phép chạm vào file nào, API nào, bảng DB nào.  
> **Thư mục làm việc:** `d:\ky1nam4\TTNM\`  
> **Quy tắc bất biến:**
> - Agent **KHÔNG** được đụng vào `d:\ky1nam4\KLTN\` (dự án khác)
> - Agent **KHÔNG** được xóa dữ liệu học viên trên DB production mà không có lệnh tường minh
> - Agent **PHẢI** chạy `BE` trước khi test bất kỳ API admin nào

---

## Ký hiệu Quy ước

| Ký hiệu | Nghĩa |
|:---:|:---|
| ✅ | Được phép đọc/ghi/tạo/xóa |
| 📖 | Chỉ được đọc (read-only) |
| ⛔ | Không được đụng vào |
| 🆕 | File/thư mục cần tạo mới |
| ✏️ | File đã có, cần sửa |

---

## PHASE A1 — Cơ sở hạ tầng Admin Portal

### A1.1. Khởi tạo Project Angular

| Hạng mục | Đường dẫn | Quyền Agent |
|:---|:---|:---:|
| Thư mục gốc project admin | `d:\ky1nam4\TTNM\admin\` | 🆕 ✅ |
| `package.json` | `admin/package.json` | 🆕 ✅ |
| `angular.json` | `admin/angular.json` | 🆕 ✅ |
| `tsconfig.json` / `tsconfig.app.json` | `admin/tsconfig*.json` | 🆕 ✅ |
| `src/main.ts` | `admin/src/main.ts` | 🆕 ✅ |
| `src/app/app.config.ts` | `admin/src/app/app.config.ts` | 🆕 ✅ |
| `src/app/app.routes.ts` | `admin/src/app/app.routes.ts` | 🆕 ✅ |
| `src/styles.scss` | `admin/src/styles.scss` | 🆕 ✅ |
| `src/theme.less` (Ng-Zorro) | `admin/src/theme.less` | 🆕 ✅ |
| **KHÔNG** đụng `2.FrontEnd/` | `d:\ky1nam4\TTNM\2.FrontEnd\` | ⛔ |
| **KHÔNG** đụng `FE/` | `d:\ky1nam4\TTNM\FE\` | ⛔ |

### A1.2. Auth Guard & HTTP Interceptor

| Hạng mục | Đường dẫn | Quyền Agent |
|:---|:---|:---:|
| `admin-auth.guard.ts` | `admin/src/app/core/guards/` | 🆕 ✅ |
| `jwt.interceptor.ts` | `admin/src/app/core/interceptors/` | 🆕 ✅ |
| `auth.service.ts` | `admin/src/app/core/services/` | 🆕 ✅ |
| `api.service.ts` (base HTTP) | `admin/src/app/core/services/` | 🆕 ✅ |
| **API BE dùng được:** `POST /api/v1/auth/login` | Spring Boot `:5228` | 📖 |
| **API BE dùng được:** `GET /api/v1/auth/me` | Spring Boot `:5228` | 📖 |
| **Bảng DB đọc:** `USERS.role`, `USERS.status` | SQL Server | 📖 |
| **KHÔNG** sửa `BE/src/` trừ khi cần thêm endpoint admin | `d:\ky1nam4\TTNM\BE\` | ⛔ → ✅ nếu cần |

### A1.3. Layout Admin (Sidebar + Header + Content)

| Hạng mục | Đường dẫn | Quyền Agent |
|:---|:---|:---:|
| `admin-layout.component.ts/html/scss` | `admin/src/app/shared/layouts/admin-layout/` | 🆕 ✅ |
| `sidebar.component.ts/html/scss` | `admin/src/app/shared/layouts/sidebar/` | 🆕 ✅ |
| `header.component.ts/html/scss` | `admin/src/app/shared/layouts/header/` | 🆕 ✅ |
| Shared components (KPI card, Data table, Loading skeleton) | `admin/src/app/shared/components/` | 🆕 ✅ |
| Models chung (user, topic, sign, response wrapper) | `admin/src/app/shared/models/` | 🆕 ✅ |

### A1.4. Login Page Admin

| Hạng mục | Đường dẫn | Quyền Agent |
|:---|:---|:---:|
| `login.component.ts/html/scss` | `admin/src/app/features/auth/` | 🆕 ✅ |
| Route `/admin/login` | `admin/src/app/app.routes.ts` | 🆕 ✅ |
| **API:** `POST /api/v1/auth/login` | BE `:5228` | 📖 |
| **Kiểm tra** `role === 'ADMIN'` từ response | Client-side | ✅ |
| **Bảng DB:** `USERS` (chỉ đọc để xác thực) | SQL Server | 📖 |

---

## MODULE 1 — Dashboard & Analytics (`admin/src/app/features/dashboard/`)

### 1.1. KPI Cards

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| `dashboard.component.ts/html/scss` | `features/dashboard/` | 🆕 ✅ |
| `kpi-card.component` | `shared/components/kpi-card/` | 🆕 ✅ |
| `dashboard.service.ts` | `features/dashboard/services/` | 🆕 ✅ |
| **API cần tạo mới BE:** `GET /api/v1/admin/stats/kpi` | `BE/src/.../AdminStatsController` | 🆕 ✅ |
| **Bảng DB đọc:** `USERS`, `SIGNS`, `TOPICS`, `PRACTICE_ATTEMPTS`, `LEARNING_PROGRESS` | SQL Server | 📖 |
| **KHÔNG** ghi vào DB từ dashboard | - | ⛔ |

### 1.2. Biểu đồ Hoạt động

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| `stat-chart.component` (wrapper ApexCharts) | `shared/components/stat-chart/` | 🆕 ✅ |
| **API:** `GET /api/v1/admin/stats/activity?days=30` | `BE AdminStatsController` | 🆕 ✅ |
| **API:** `GET /api/v1/admin/stats/practice-by-topic` | `BE AdminStatsController` | 🆕 ✅ |
| **API:** `GET /api/v1/admin/stats/users-by-level` | `BE AdminStatsController` | 🆕 ✅ |
| **Bảng DB:** `USERS.created_at`, `PRACTICE_ATTEMPTS.created_at`, `LEARNING_PROGRESS` | SQL Server | 📖 |

### 1.3. Activity Feed & Leaderboard

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| `activity-feed.component` | `features/dashboard/components/` | 🆕 ✅ |
| `leaderboard-preview.component` | `features/dashboard/components/` | 🆕 ✅ |
| **API:** `GET /api/v1/admin/stats/recent-activity?limit=20` | `BE AdminStatsController` | 🆕 ✅ |
| **API:** `GET /api/v1/admin/stats/leaderboard?limit=5` | `BE AdminStatsController` | 🆕 ✅ |
| **Bảng DB đọc:** `USERS`, `QUIZ_ATTEMPTS`, `PRACTICE_ATTEMPTS`, `LEARNING_PROGRESS` | SQL Server | 📖 |

---

## MODULE 2 — Quản lý Người dùng (`admin/src/app/features/users/`)

### 2.1. Danh sách Học viên

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| `user-list.component.ts/html/scss` | `features/users/components/user-list/` | 🆕 ✅ |
| `user.service.ts` | `features/users/services/` | 🆕 ✅ |
| `user.model.ts` | `features/users/models/` | 🆕 ✅ |
| **API cần tạo BE:** `GET /api/v1/admin/users?page=&size=&search=&status=` | `BE AdminUserController` | 🆕 ✅ |
| **Bảng DB đọc:** `USERS` (tất cả cột trừ `password_hash`) | SQL Server | 📖 |
| **KHÔNG đọc** `password_hash` từ API | BE validation | ⛔ |

### 2.2. Thêm / Chỉnh sửa Học viên

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| `user-form.component` (Modal/Drawer) | `features/users/components/user-form/` | 🆕 ✅ |
| **API:** `POST /api/v1/admin/users` (tạo mới) | `BE AdminUserController` | 🆕 ✅ |
| **API:** `PUT /api/v1/admin/users/{id}` (cập nhật) | `BE AdminUserController` | 🆕 ✅ |
| **Bảng DB ghi:** `USERS` (full_name, email, phone, avatar_url, role, xp, level) | SQL Server | ✅ |
| **KHÔNG** cho Admin tự sửa `user_id`, `created_at` | BE validation | ⛔ |

### 2.3. Khóa / Mở khóa

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| **API:** `PATCH /api/v1/admin/users/{id}/status` | `BE AdminUserController` | 🆕 ✅ |
| **Bảng DB ghi:** `USERS.status` | SQL Server | ✅ |
| **KHÔNG** xóa user khỏi DB (chỉ toggle status) | - | ⛔ |

### 2.4. Xem Chi tiết & Hồ sơ Học tập

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| `user-detail.component` (Drawer hoặc trang riêng) | `features/users/components/user-detail/` | 🆕 ✅ |
| **API:** `GET /api/v1/admin/users/{id}/profile` | `BE AdminUserController` | 🆕 ✅ |
| **API:** `GET /api/v1/admin/users/{id}/quiz-history?limit=10` | `BE AdminUserController` | 🆕 ✅ |
| **API:** `GET /api/v1/admin/users/{id}/topic-progress` | `BE AdminUserController` | 🆕 ✅ |
| **Bảng DB đọc:** `USERS`, `QUIZ_ATTEMPTS`, `LEARNING_PROGRESS`, `PRACTICE_ATTEMPTS` | SQL Server | 📖 |

### 2.5. Reset Mật khẩu

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| **API:** `POST /api/v1/admin/users/{id}/reset-password` | `BE AdminUserController` | 🆕 ✅ |
| **Bảng DB ghi:** `USERS.password_hash` (BCrypt mới) | SQL Server | ✅ |

---

## MODULE 3 — Quản lý Chủ đề (`admin/src/app/features/topics/`)

### 3.1. Danh sách Chủ đề

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| `topic-list.component` | `features/topics/components/topic-list/` | 🆕 ✅ |
| `topic.service.ts` | `features/topics/services/` | 🆕 ✅ |
| `topic.model.ts` | `features/topics/models/` | 🆕 ✅ |
| **API tái sử dụng BE hiện có:** `GET /api/v1/topics` | `BE TopicController` (đã có) | 📖 |
| **API cần thêm:** `GET /api/v1/admin/topics` (có thêm `signsCount`, `is_active`) | `BE AdminTopicController` | 🆕 ✅ |
| **Bảng DB đọc:** `TOPICS` JOIN `COUNT(SIGNS)` | SQL Server | 📖 |

### 3.2. Thêm / Chỉnh sửa Chủ đề

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| `topic-form.component` | `features/topics/components/topic-form/` | 🆕 ✅ |
| **API:** `POST /api/v1/admin/topics` | `BE AdminTopicController` | 🆕 ✅ |
| **API:** `PUT /api/v1/admin/topics/{id}` | `BE AdminTopicController` | 🆕 ✅ |
| **Bảng DB ghi:** `TOPICS` (name, emoji, level, category, description, display_order, is_active) | SQL Server | ✅ |

### 3.3. Kích hoạt / Ẩn & Drag-Drop Thứ tự

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| **API:** `PATCH /api/v1/admin/topics/{id}/status` | `BE AdminTopicController` | 🆕 ✅ |
| **API:** `PUT /api/v1/admin/topics/reorder` (batch) | `BE AdminTopicController` | 🆕 ✅ |
| **Bảng DB ghi:** `TOPICS.is_active`, `TOPICS.display_order` | SQL Server | ✅ |
| **KHÔNG** xóa topic (chỉ ẩn) | - | ⛔ |

---

## MODULE 4 — Quản lý Ký hiệu & Video (`admin/src/app/features/signs/`)

### 4.1. Danh sách Ký hiệu

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| `sign-list.component` | `features/signs/components/sign-list/` | 🆕 ✅ |
| `sign.service.ts` | `features/signs/services/` | 🆕 ✅ |
| `sign.model.ts` | `features/signs/models/` | 🆕 ✅ |
| **API:** `GET /api/v1/admin/signs?page=&topic=&difficulty=&search=` | `BE AdminSignController` | 🆕 ✅ |
| **Bảng DB đọc:** `SIGNS` JOIN `TOPICS` | SQL Server | 📖 |

### 4.2. Thêm / Chỉnh sửa Ký hiệu

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| `sign-form.component` (Tab 3 panels) | `features/signs/components/sign-form/` | 🆕 ✅ |
| `sign-preview.component` (Preview mobile) | `features/signs/components/sign-preview/` | 🆕 ✅ |
| `steps-editor.component` (Dynamic JSON form) | `features/signs/components/steps-editor/` | 🆕 ✅ |
| **API:** `POST /api/v1/admin/signs` | `BE AdminSignController` | 🆕 ✅ |
| **API:** `PUT /api/v1/admin/signs/{id}` | `BE AdminSignController` | 🆕 ✅ |
| **Bảng DB ghi:** `SIGNS` (tất cả cột trừ `sign_id`, `created_at`) | SQL Server | ✅ |

### 4.3. Kích hoạt / Ẩn Ký hiệu

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| **API:** `PATCH /api/v1/admin/signs/{id}/status` | `BE AdminSignController` | 🆕 ✅ |
| **Bảng DB ghi:** `SIGNS.is_active` | SQL Server | ✅ |
| **KHÔNG** xóa sign có `LEARNING_PROGRESS` hoặc `PRACTICE_ATTEMPTS` liên kết | BE validation | ⛔ |

### 4.4. Import Hàng loạt CSV/Excel

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| `sign-import.component` | `features/signs/components/sign-import/` | 🆕 ✅ |
| **API:** `POST /api/v1/admin/signs/import` (multipart/form-data) | `BE AdminSignController` | 🆕 ✅ |
| **Bảng DB ghi:** `SIGNS` (bulk insert) | SQL Server | ✅ |
| **KHÔNG** import đè lên `sign_id` đã tồn tại | BE validation | ⛔ |

---

## MODULE 5 — Quản lý Quiz (`admin/src/app/features/quiz/`)

### 5.1. Cấu hình Quiz & Câu hỏi

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| `quiz-config.component` | `features/quiz/components/quiz-config/` | 🆕 ✅ |
| `quiz-question-list.component` | `features/quiz/components/quiz-question-list/` | 🆕 ✅ |
| `quiz-question-form.component` | `features/quiz/components/quiz-question-form/` | 🆕 ✅ |
| `quiz-admin.service.ts` | `features/quiz/services/` | 🆕 ✅ |
| **API:** `GET /api/v1/admin/quiz/questions?topic=` | `BE AdminQuizController` | 🆕 ✅ |
| **API:** `POST /api/v1/admin/quiz/questions` | `BE AdminQuizController` | 🆕 ✅ |
| **API:** `PUT /api/v1/admin/quiz/questions/{id}` | `BE AdminQuizController` | 🆕 ✅ |
| **API:** `DELETE /api/v1/admin/quiz/questions/{id}` | `BE AdminQuizController` | ✅ |
| **Bảng DB ghi:** Bảng `QUIZ_QUESTIONS` mới (nếu cần tách riêng) hoặc metadata trong `SIGNS` | SQL Server | 🆕 ✅ |

### 5.2. Lịch sử Kết quả Quiz

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| `quiz-history.component` | `features/quiz/components/quiz-history/` | 🆕 ✅ |
| **API:** `GET /api/v1/admin/quiz/attempts?topic=&userId=&from=&to=` | `BE AdminQuizController` | 🆕 ✅ |
| **Bảng DB đọc:** `QUIZ_ATTEMPTS` JOIN `USERS` JOIN `TOPICS` | SQL Server | 📖 |
| **Xuất Excel:** Dùng `exceljs` client-side | `admin/` | ✅ |
| **KHÔNG** sửa/xóa `QUIZ_ATTEMPTS` | - | ⛔ |

---

## MODULE 6 — Giám sát Học tập & AI (`admin/src/app/features/monitoring/`)

### 6.1. Tổng quan Tiến độ Học tập

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| `progress-heatmap.component` | `features/monitoring/components/progress-heatmap/` | 🆕 ✅ |
| `hard-words.component` (Top từ khó) | `features/monitoring/components/hard-words/` | 🆕 ✅ |
| **API:** `GET /api/v1/admin/monitoring/progress-matrix` | `BE AdminMonitoringController` | 🆕 ✅ |
| **API:** `GET /api/v1/admin/monitoring/hard-signs?limit=10` | `BE AdminMonitoringController` | 🆕 ✅ |
| **Bảng DB đọc:** `LEARNING_PROGRESS` JOIN `USERS` JOIN `SIGNS` | SQL Server | 📖 |

### 6.2. Giám sát AI Camera

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| `ai-monitor.component` | `features/monitoring/components/ai-monitor/` | 🆕 ✅ |
| `confusion-matrix.component` | `features/monitoring/components/confusion-matrix/` | 🆕 ✅ |
| **API:** `GET /api/v1/admin/monitoring/practice-attempts?isCorrect=false&limit=50` | `BE AdminMonitoringController` | 🆕 ✅ |
| **API:** `GET /api/v1/admin/monitoring/accuracy-by-sign` | `BE AdminMonitoringController` | 🆕 ✅ |
| **Bảng DB đọc:** `PRACTICE_ATTEMPTS` JOIN `SIGNS` JOIN `USERS` | SQL Server | 📖 |
| **KHÔNG** sửa/xóa `PRACTICE_ATTEMPTS` | - | ⛔ |

### 6.3. Streak & Engagement

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| `streak-report.component` | `features/monitoring/components/streak-report/` | 🆕 ✅ |
| **API:** `GET /api/v1/admin/monitoring/streak-report` | `BE AdminMonitoringController` | 🆕 ✅ |
| **Bảng DB đọc:** `USERS.streak_days`, `USERS.updated_at` | SQL Server | 📖 |

---

## MODULE 7 — Hệ thống & Cấu hình (`admin/src/app/features/system/`)

### 7.1. Quản lý Tài khoản Admin

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| `admin-account.component` | `features/system/components/admin-account/` | 🆕 ✅ |
| **API:** `GET /api/v1/admin/system/admins` | `BE AdminSystemController` | 🆕 ✅ |
| **API:** `POST /api/v1/admin/system/admins` | `BE AdminSystemController` | 🆕 ✅ |
| **API:** `POST /api/v1/admin/system/admins/{id}/change-password` | `BE AdminSystemController` | 🆕 ✅ |
| **Bảng DB ghi:** `USERS` (chỉ với `role = 'ADMIN'`) | SQL Server | ✅ |

### 7.2. Cấu hình Hệ thống

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| `system-config.component` | `features/system/components/system-config/` | 🆕 ✅ |
| **API:** `GET /api/v1/admin/system/config` | `BE AdminSystemController` | 🆕 ✅ |
| **API:** `PUT /api/v1/admin/system/config` | `BE AdminSystemController` | 🆕 ✅ |
| **Bảng DB mới (nếu cần):** `SYSTEM_CONFIG` (key-value store) | SQL Server | 🆕 ✅ |

### 7.3. Health Check Realtime

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| `health-check.component` | `features/system/components/health-check/` | 🆕 ✅ |
| **API:** `GET /api/v1/admin/system/health` | `BE AdminSystemController` | 🆕 ✅ |
| **Dùng SignalR** (`@microsoft/signalr` đã có trong `2.FrontEnd`) | `admin/` | ✅ |
| **KHÔNG** thao tác trực tiếp lên DB production qua health check | - | ⛔ |

### 7.4. Audit Log

| Hạng mục | Đường dẫn / API | Quyền Agent |
|:---|:---|:---:|
| `audit-log.component` | `features/system/components/audit-log/` | 🆕 ✅ |
| **API:** `GET /api/v1/admin/system/audit-log?page=&action=&adminId=&from=&to=` | `BE AdminSystemController` | 🆕 ✅ |
| **Bảng DB mới:** `ADMIN_AUDIT_LOG` (admin_id, action, target_type, target_id, timestamp) | SQL Server | 🆕 ✅ |
| **KHÔNG** cho phép xóa audit log | - | ⛔ |

---

## Phạm vi Backend cần bổ sung

> Agent được phép tạo mới các Controller và Service sau trong `d:\ky1nam4\TTNM\BE\`

| Controller mới | Package đề xuất | Method cần tạo |
|:---|:---|:---|
| `AdminStatsController` | `com.example.demo.controller.admin` | `getKpi`, `getActivity`, `getPracticeByTopic`, `getUsersByLevel`, `getRecentActivity`, `getLeaderboard` |
| `AdminUserController` | `com.example.demo.controller.admin` | `listUsers`, `createUser`, `updateUser`, `toggleStatus`, `getUserProfile`, `getQuizHistory`, `getTopicProgress`, `resetPassword` |
| `AdminTopicController` | `com.example.demo.controller.admin` | `listTopics`, `createTopic`, `updateTopic`, `toggleStatus`, `reorderTopics` |
| `AdminSignController` | `com.example.demo.controller.admin` | `listSigns`, `createSign`, `updateSign`, `toggleStatus`, `importSigns` |
| `AdminQuizController` | `com.example.demo.controller.admin` | `listQuestions`, `createQuestion`, `updateQuestion`, `deleteQuestion`, `listAttempts` |
| `AdminMonitoringController` | `com.example.demo.controller.admin` | `getProgressMatrix`, `getHardSigns`, `getPracticeAttempts`, `getAccuracyBySign`, `getStreakReport` |
| `AdminSystemController` | `com.example.demo.controller.admin` | `listAdmins`, `createAdmin`, `changeAdminPassword`, `getConfig`, `updateConfig`, `getHealth`, `getAuditLog` |

> **Spring Security:** Tất cả route `/api/v1/admin/**` phải được bảo vệ bởi role `ADMIN`  
> **File cần sửa:** `BE/src/main/java/com/example/demo/config/SecurityConfig.java` — thêm `hasRole("ADMIN")` cho prefix `/api/v1/admin`

---

## Quy tắc Bất di bất dịch cho Agent

> [!CAUTION]
> Các quy tắc sau PHẢI được tuân thủ tuyệt đối:

1. **Không xóa dữ liệu học viên:** Agent không được `DELETE FROM USERS`, `TRUNCATE LEARNING_PROGRESS`, hoặc `DROP TABLE` bất kỳ bảng nào trên DB production.

2. **Không đụng `FE/` và `2.FrontEnd/`:** Admin portal là project riêng trong `admin/`. Không sửa code React Native hay Angular cũ của học viên.

3. **Không đụng `D:\ky1nam4\KLTN\`:** Đây là dự án khác hoàn toàn.

4. **Khởi động BE trước khi test:** Mọi thao tác test API admin đều cần BE đang chạy trên port `5228`.  
   ```powershell
   cd d:\ky1nam4\TTNM\BE && .\gradlew.bat bootRun
   ```

5. **Prefix tất cả admin API bằng `/api/v1/admin/`:** Tách biệt hoàn toàn với API học viên `/api/v1/`.

6. **Password không bao giờ trả về trong API response:** `USERS.password_hash` luôn bị exclude khỏi DTO.

7. **Soft delete thay vì hard delete:** Với Users và Signs — chỉ toggle `status`/`is_active`. Với Quiz Questions — cho phép xóa cứng vì không có FK.
