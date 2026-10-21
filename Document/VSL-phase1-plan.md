# Kế hoạch Phase 1 theo Chức năng (BE + FE)

> Căn cứ: [VSL-phase.md](VSL-phase.md), [VSL-scope.md](VSL-scope.md), [VSL-DB.md](VSL-DB.md) và mã nguồn ngày 14/10/2026.
> **Nguyên tắc:** giao diện FE đã có sẵn. Mỗi chức năng = làm/sửa API ở BE → nối API vào màn hình FE Mobile (`FE/src/screens`) và Web Portal (`FE/screens`). Một người nhận trọn một chức năng từ BE đến FE.

---

## 0. Tổng quan

| Mã | Chức năng | Màn hình Mobile | Web Portal | BE cần làm | Cỡ |
| :--- | :--- | :--- | :--- | :--- | :---: |
| CN-0 | Nền tảng chung (bảo mật, xử lý 401) | `apiClient.js`, `AppNavigator.js` | mọi `script.js` | Sửa `SecurityConfig`, bỏ "lấy user đầu tiên" | 1 ngày |
| CN-1 | Đăng nhập / Đăng ký / Giữ phiên | `LoginScreen`, `RegisterScreen` | `04_dang_nhap_tai_khoan` | API đã có, chỉ chỉnh nhỏ | 1,5 ngày |
| CN-2 | Trang chủ & Tiến độ | `HomeScreen` | `08_trang_chu_tien_do` | Sửa `DashboardServiceImpl` (bỏ số cứng) | 2 ngày |
| CN-3 | Danh mục chủ đề | `TopicsScreen` | `07_danh_muc_chu_de` | Thêm lọc + tiến độ vào `GET /topics` | 2 ngày |
| CN-4 | Chi tiết chủ đề | `TopicDetailScreen` | `02_chi_tiet_chu_de_chao_hoi` | Thêm trạng thái học vào `GET /topics/{id}/signs` | 1,5 ngày |
| CN-5 | Chi tiết ký hiệu & Video | `SignDetailScreen` | `06_chi_tiet_ky_hieu` | Thêm trạng thái vào `GET /signs/{id}`; video thật | 2 ngày |
| CN-6 | Quiz | `QuizScreen` | `01_kiem_tra_quiz` | **Làm mới** `QuizController` + `QuizService` | 3 ngày |
| CN-7 | Hồ sơ cá nhân | `ProfileScreen` | `05_ho_so_ca_nhan_thanh_tich` | Thêm `GET /users/me/stats` | 1,5 ngày |
| CN-8 | AI Camera (mockup) | `AICameraScreen` | `03_phong_thuc_hanh_ai_camera` | Không làm (Phase 2) | — |

**Thứ tự:** CN-0 → CN-1 → (CN-2 … CN-7 làm song song). Riêng CN-6 Quiz là nơi **tạo ra tiến độ học thật** trong Phase 1 (AI Camera chưa chấm được), nên CN-2/3/4/7 cần CN-6 xong mới kiểm tra được số liệu khác 0.

**Quy ước chung**
- Base URL: `http://<IP-máy-BE>:5228/api/v1`. Mọi response bọc trong `CommonResponse`: `{ status, message, data, timestamp }`. FE đọc `res.data`.
- API cá nhân gửi header `Authorization: Bearer <token>`.
- BE lấy user hiện tại qua `Authentication authentication` → `authentication.getName()` là email.
- Mobile gọi API qua các hàm trong `FE/src/api/apiClient.js`; chuyển dữ liệu ký hiệu bằng `mapSign` trong `FE/src/api/mappers.js`.

---

## CN-0. Nền tảng chung: bảo mật & xử lý 401

**Vấn đề hiện tại:** `/dashboard`, `/signs/**` đang `permitAll`. Khi không có token, `DashboardServiceImpl` và `SignServiceImpl.resolveUser()` tự lấy **user đầu tiên trong DB** → ai cũng xem/ghi được dữ liệu của user đó.

### BE

1. `shared/config/SecurityConfig.java` — phân quyền theo method:

```java
.authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/v1/auth/login", "/api/v1/auth/register",
                "/api/v1/public/**", "/v3/api-docs/**", "/swagger-ui/**",
                "/swagger-ui.html", "/error").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/v1/topics/**", "/api/v1/signs/**").permitAll()
        .anyRequest().authenticated()
)
.exceptionHandling(ex -> ex.authenticationEntryPoint((req, res, e) -> {
    res.setStatus(401);
    res.setContentType("application/json;charset=UTF-8");
    res.getWriter().write("{\"status\":401,\"message\":\"Phiên đăng nhập đã hết hạn\"}");
}))
```

2. Thay fallback "user đầu tiên" bằng ném lỗi (áp dụng ở `SignServiceImpl.resolveUser`, `DashboardServiceImpl`, và các service mới):

```java
private User requireUser(String email) {
    if (email == null) throw new AppException(ErrorCode.UNAUTHENTICATED);
    return userRepository.findByEmail(email)
            .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
}
```

3. Dọn cấu hình: đang có cả `application.properties` và `application.yml` với `ddl-auto` khác nhau → giữ một file. Chọn một nguồn seed: `seed-data.sql` **hoặc** `DataInitializer`. User demo không seed sẵn XP / streak / tiến độ giả.

### FE Mobile — `FE/src/api/apiClient.js`

Lưu token bền vững và tự đăng xuất khi gặp 401:

```bash
npx expo install @react-native-async-storage/async-storage
```

```js
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'vsl_token';
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export async function saveSession(token, user) {
  setAuthToken(token);
  setCurrentUser(user);
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function loadSession() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) setAuthToken(token);
  return token;
}

export async function clearAuth() {
  currentToken = null;
  currentUser = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// Trong request(), ngay sau khi nhận response:
if (response.status === 401) {
  await clearAuth();
  onUnauthorized?.();
  throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
}
```

### FE Web Portal

Tạo hàm dùng chung (chép vào đầu mỗi `script.js` hoặc tách `screens/api.js`):

```js
const API_BASE = 'http://localhost:5228/api/v1';
async function api(path, options = {}) {
  const token = localStorage.getItem('vsl_token');
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: { 'Content-Type': 'application/json',
               ...(token && { Authorization: `Bearer ${token}` }) },
  });
  if (res.status === 401) {
    localStorage.removeItem('vsl_token');
    location.href = '../04_dang_nhap_tai_khoan/index.html';
    return;
  }
  return (await res.json()).data;
}
```

**Nghiệm thu:** gọi `GET /dashboard` không token → `401`; token của user B → chỉ thấy dữ liệu của B.

---

## CN-1. Đăng nhập / Đăng ký / Giữ phiên

| | |
| :--- | :--- |
| Màn hình | `LoginScreen.js`, `RegisterScreen.js` · Web `04_dang_nhap_tai_khoan` |
| Hiện trạng | API login/register/me đã chạy; Mobile chỉ giữ token trong RAM (tắt app là mất phiên); 3 nút "Sinh trắc học / Google / Khách" thực chất gọi đăng nhập thường |

### API (đã có)

| Method | Path | Auth | Request | Response `data` |
| :--- | :--- | :---: | :--- | :--- |
| POST | `/auth/login` | — | `{ email, password }` | `{ accessToken, user: UserResponse }` |
| POST | `/auth/register` | — | `{ fullName, email, password, phone }` | như trên |
| GET | `/auth/me` | ✔ | — | `UserResponse` |

### BE
- Cấu hình `smr.auth.public-registration` có trong `application.yml` nhưng **chưa được code nào đọc** → hoặc xóa, hoặc kiểm tra cờ này trong `AuthServiceImpl.register`.
- Sai mật khẩu → trả `ErrorCode.INVALID_CREDENTIALS` (401) với message rõ ràng.

### FE Mobile
1. `apiLogin` / `apiRegister`: thay `setAuthToken + setCurrentUser` bằng `await saveSession(res.data.accessToken, res.data.user)`.
2. `AppNavigator.js` — tự đăng nhập khi mở app:

```js
const navigationRef = createNavigationContainerRef();

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    setUnauthorizedHandler(() =>
      navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] }));
    (async () => {
      const token = await loadSession();
      if (!token) return setInitialRoute('Login');
      try { await apiGetMe(); setInitialRoute('MainTabs'); }
      catch { setInitialRoute('Login'); }
    })();
  }, []);

  if (!initialRoute) return <ActivityIndicator style={{ flex: 1 }} />;
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName={initialRoute} ...>
```

3. `LoginScreen.js`: ẩn 3 nút đăng nhập phụ (hoặc `Alert` "Chưa hỗ trợ"); "Ghi nhớ tôi" tắt → không ghi AsyncStorage.
4. `ProfileScreen.js` nút Đăng xuất: `await clearAuth()` rồi `navigation.replace('Login')`.

### FE Web Portal
`04_dang_nhap_tai_khoan/script.js` đã lưu `vsl_token` vào `localStorage` → chỉ cần kiểm tra các trang khác dùng hàm `api()` ở CN-0.

**Nghiệm thu:** đăng nhập đúng → vào Trang chủ; tắt app mở lại vẫn đăng nhập; sai mật khẩu → báo lỗi; đăng ký tài khoản mới → vào thẳng Trang chủ.

---

## CN-2. Trang chủ & Tiến độ

| | |
| :--- | :--- |
| Màn hình | `HomeScreen.js` · Web `08_trang_chu_tien_do` |
| Hiện trạng | FE đã gọi `GET /dashboard`. BE **hard-code** 400 / 100 / 35 / 30% / 94.2% / "Sơ cấp A1" và fallback 120 / 34 / 85 / 8; FE chưa hiện "Từ cần ôn tập" |

### API

`GET /dashboard` (✔ auth) — giữ nguyên format `DashboardResponse`, chỉ đổi cách tính:

| Trường | Cách tính |
| :--- | :--- |
| `courseOverview.totalSigns` | số `SIGNS` có `is_active = 1` |
| `courseOverview.masteredSigns` | số `LEARNING_PROGRESS` của user có `status = 'mastered'` |
| `totalPhrases` / `masteredPhrases` | như trên, lọc `content_type = 'phrases'` |
| `overallProgress` | `masteredSigns * 100 / totalSigns` |
| `openTopicsCount` | số `TOPICS` active |
| `aiAccuracy` | `AVG(PRACTICE_ATTEMPTS.confidence) * 100` của user; chưa luyện → `null` |
| `levelTitle` | suy từ `USERS.level` (bảng ánh xạ trong code) |
| `currentTopic` | chủ đề của ký hiệu có `last_studied_at` gần nhất; chưa học → chủ đề `display_order` nhỏ nhất |
| `reviewSigns` | ký hiệu có `status = 'review'` (đã có) |

### BE — `DashboardServiceImpl.java`

Thêm query vào repository (tránh lặp từng ký hiệu như hiện tại):

```java
// SignRepository
long countByIsActive(Boolean isActive);
long countByIsActiveAndContentType(Boolean isActive, String contentType);

// LearningProgressRepository
long countByUser_UserIdAndStatusAndSign_ContentType(Long userId, String status, String contentType);
Optional<LearningProgress> findFirstByUser_UserIdAndLastStudiedAtNotNullOrderByLastStudiedAtDesc(Long userId);
long countByUser_UserIdAndStatusAndSign_Topic_TopicId(Long userId, String status, Long topicId);

// PracticeAttemptRepository
@Query("select avg(p.confidence) from PracticeAttempt p where p.user.userId = :userId")
BigDecimal averageConfidence(@Param("userId") Long userId);
```

```java
User user = requireUser(userEmail);
long totalSigns = signRepository.countByIsActive(true);
long mastered = progressRepository.countByUser_UserIdAndStatus(user.getUserId(), "mastered");
BigDecimal avg = practiceRepository.averageConfidence(user.getUserId());

DashboardResponse.CourseOverview overview = DashboardResponse.CourseOverview.builder()
        .totalSigns((int) totalSigns)
        .masteredSigns((int) mastered)
        .overallProgress(totalSigns == 0 ? 0 : (int) (mastered * 100 / totalSigns))
        .aiAccuracy(avg == null ? null : avg.doubleValue() * 100)
        // ... totalPhrases, masteredPhrases, openTopicsCount, levelTitle
        .build();
```

Xóa hết các giá trị cứng (`85`, `34`, `120`, `8`, `400`, `100`, `35`, `30`, `94.2`).

### FE Mobile — `HomeScreen.js`
- Phần đọc `dashboardData` đã sẵn (đã bỏ mock).
- Thêm mục **"Từ cần ôn tập"** dưới "Ký hiệu tiêu biểu", dùng lại card đang có:

```js
const reviewSigns = (dashboardData?.reviewSigns || []).map(mapSign);
// render giống displaySigns, ẩn cả mục nếu reviewSigns.length === 0
```

- `aiAccuracy` null → hiện `--` thay vì `0%`.

### FE Web Portal
`08_trang_chu_tien_do/script.js`: đổi `fetch` sang `api('/dashboard')` (có token), render thêm `reviewSigns`.

**Nghiệm thu:** tài khoản mới → mọi chỉ số 0, AI `--`, chủ đề đang học là chủ đề 1; làm Quiz sai 1 từ → từ đó hiện ở "Từ cần ôn tập".

---

## CN-3. Danh mục chủ đề

| | |
| :--- | :--- |
| Màn hình | `TopicsScreen.js` · Web `07_danh_muc_chu_de` |
| Hiện trạng | `GET /topics` trả danh sách, **không có tiến độ**, không lọc. Tab FE đang là Cơ bản / Ký hiệu đơn / Câu giao tiếp — tài liệu yêu cầu lọc theo cấp độ |

### API

`GET /topics?level={level}&search={keyword}` (auth tùy chọn)

```json
[
  { "topicId": 1, "name": "Chào hỏi & Xã giao", "emoji": "👋", "level": "Cơ bản",
    "category": "single phrases", "description": "...", "displayOrder": 1,
    "signCount": 5, "masteredCount": 2, "progress": 40 }
]
```

`masteredCount`, `progress` chỉ có khi gửi token; không token → `null`.

### BE
1. `TopicResponse`: thêm `Integer masteredCount; Integer progress;`.
2. `TopicRepository`: lọc theo `level` bằng query (`findActiveByLevel`). Từ khóa `search` lọc ở Java, sau khi chuẩn hóa bỏ dấu bằng `java.text.Normalizer` (gõ "y te" vẫn khớp "Y tế"). Không dùng `LIKE` trên SQL Server: với collation hiện tại, `LIKE` không khớp được các chữ có dấu kép như "ế", "ẩ".

3. `LearningProgressRepository`: đếm mastered theo chủ đề trong **1 query**:

```java
@Query("select lp.sign.topic.topicId, count(lp) from LearningProgress lp " +
       "where lp.user.userId = :userId and lp.status = 'mastered' group by lp.sign.topic.topicId")
List<Object[]> countMasteredByTopic(@Param("userId") Long userId);
```

4. `TopicController.getAllTopics(level, search, Authentication)` → `TopicServiceImpl` ghép `masteredCount` và `progress = masteredCount * 100 / signCount`.

### FE Mobile — `TopicsScreen.js`
1. `apiClient.js`: `apiGetTopics(level, search)` thêm query string (giống `apiGetAllSigns`).
2. Đổi 4 chip lọc thành theo cấp độ: **Tất cả / Nhập môn / Cơ bản / Trung cấp / Nâng cao**; bấm chip → gọi lại API với `level`.
3. Ô tìm kiếm: giữ lọc tại chỗ (đủ nhanh với 8 chủ đề) hoặc gọi API với `search` (debounce 300 ms).
4. Map thêm `progress: t.progress`; hiện lại thanh tiến độ trên thẻ khi `progress != null` (style `miniBarTrack` / `miniBarFill` vẫn còn trong file).

### FE Web Portal
`07_danh_muc_chu_de/script.js`: gọi `api('/topics?level=...')`, hiện thanh tiến độ.

**Nghiệm thu:** hiện 8 chủ đề; mỗi tab cấp độ lọc đúng; % tiến độ khớp số ký hiệu `mastered` trong CSDL.

---

## CN-4. Chi tiết chủ đề

| | |
| :--- | :--- |
| Màn hình | `TopicDetailScreen.js` · Web `02_chi_tiet_chu_de_chao_hoi` |
| Hiện trạng | Danh sách ký hiệu đã lấy từ API, số tab đã tính thật; **chưa có trạng thái học** từng ký hiệu |

### API

`GET /topics/{topicId}/signs` (auth tùy chọn) — `SignResponse` thêm 2 trường:

```json
{ "signId": 1, "nameVi": "Xin chào", "...": "...",
  "status": "mastered", "masteryScore": 95.0 }
```

Không token hoặc chưa học → `status: "unlearned"`, `masteryScore: 0`.

### BE
1. `SignResponse`: thêm `String status; BigDecimal masteryScore;`.
2. `LearningProgressRepository`: `List<LearningProgress> findByUser_UserIdAndSign_Topic_TopicId(Long userId, Long topicId);`
3. `TopicServiceImpl.getSignsByTopic(topicId, email)`: lấy danh sách ký hiệu + 1 query tiến độ → đưa vào `Map<signId, LearningProgress>` → gán `status` / `masteryScore` khi map sang DTO.

### FE Mobile — `TopicDetailScreen.js`
1. `mappers.js` — `mapSign` thêm `status: s.status`, `masteryScore: s.masteryScore`.
2. Trong card, thay `<View />` (chỗ trống hiện tại) bằng badge theo `item.status`: `mastered` → "Đã thuộc (AI x%)", `review` → "Cần ôn tập", còn lại → "Chưa học" (style `masteredTag` vẫn còn trong file).
3. Thêm lại tab **"Cần ôn tập (n)"** lọc `status === 'review'`.
4. Thêm nút **"Làm Quiz chủ đề"** → `navigation.navigate('Quiz', { topicId: topic.topicId })` (dùng ở CN-6).
5. Khối "Tiến độ chủ đề": dùng `topic.progress` / `masteredCount` từ CN-3 (khi mở từ Danh mục) hoặc từ dashboard (khi mở từ Trang chủ).

### FE Web Portal
`02_chi_tiet_chu_de_chao_hoi/script.js`: gọi `api('/topics/' + id + '/signs')` (có token) và hiện badge trạng thái.

**Nghiệm thu:** mở chủ đề 1 → đúng 5 ký hiệu từ CSDL; badge khớp `LEARNING_PROGRESS`.

---

## CN-5. Chi tiết ký hiệu & Video

| | |
| :--- | :--- |
| Màn hình | `SignDetailScreen.js` · Web `06_chi_tiet_ky_hieu` |
| Hiện trạng | Đã gọi `GET /signs/{id}`, hiện đủ các bước & lưu ý văn hóa; **chưa phát video**; `video_url` trong seed là video mẫu Big Buck Bunny |

### API

`GET /signs/{signId}` (auth tùy chọn) — trả thêm `status`, `masteryScore` như CN-4.

### BE
1. `SignServiceImpl.getSignById(signId, email)`: nếu có user → gắn `status` / `masteryScore`.
2. **Dữ liệu:** quay/tìm video VSL thật cho 5 ký hiệu → upload qua `POST /files/upload` (MinIO đã cấu hình) → cập nhật `video_url`, `video_thumb` trong seed. *Việc này cần nhóm chuẩn bị sớm.*

### FE Mobile — `SignDetailScreen.js`

```bash
npx expo install expo-video
```

```js
import { useVideoPlayer, VideoView } from 'expo-video';

const player = useVideoPlayer(sign?.videoUrl || null, (p) => { p.loop = true; p.play(); });

// Nối các nút có sẵn vào player:
// Play/Pause:   isPlaying ? player.pause() : player.play()
// Lặp lại:      player.loop = !isLooping
// Tốc độ:       player.playbackRate = 0.75  (1.0 / 0.75 / 0.5)

<VideoView player={player} style={styles.videoCover} contentFit="cover" nativeControls={false} />
// Không có videoUrl → giữ placeholder hiện tại
```

Thanh thời gian: dùng `player.currentTime` / `player.duration` (cập nhật bằng sự kiện `timeUpdate`) thay cho thanh trống.

### FE Web Portal
`06_chi_tiet_ky_hieu/script.js`: dùng thẻ `<video src="..." loop autoplay muted playsinline>`; tốc độ qua `video.playbackRate`.

**Nghiệm thu:** mở "Xin chào" → video phát, chỉnh được tốc độ và lặp; hiện đủ các bước và lưu ý văn hóa.

---

## CN-6. Quiz (chức năng mới hoàn toàn ở BE)

| | |
| :--- | :--- |
| Màn hình | `QuizScreen.js` · Web `01_kiem_tra_quiz` |
| Hiện trạng | BE có entity `QuizAttempt`, repository, mapper, DTO nhưng **chưa có Controller/Service**. FE đang tự sinh câu hỏi từ `GET /signs`, không lưu điểm |

### API

**1. Sinh đề** — `GET /quizzes/generate?topicId={id}&count=5` (✔ auth). `topicId` bỏ trống → lấy toàn bộ ký hiệu.

```json
[
  { "signId": 2, "videoUrl": "...", "videoThumb": "...",
    "hint": "Đầu ngón tay chạm cằm rồi đưa nhẹ ra trước.",
    "options": [ { "signId": 1, "text": "Xin chào" }, { "signId": 2, "text": "Cảm ơn" },
                 { "signId": 3, "text": "Tạm biệt" }, { "signId": 5, "text": "Xin lỗi" } ],
    "correctSignId": 2 }
]
```

> Gửi `correctSignId` để FE báo Đúng/Sai tức thì (đơn giản cho BTL). Điểm chính thức vẫn do server tự chấm ở bước nộp bài.

**2. Nộp bài** — `POST /quizzes/submit` (✔ auth)

```json
{ "topicId": 1, "startedAt": "2026-10-14T15:00:00",
  "answers": [ { "signId": 2, "selectedSignId": 2 }, { "signId": 5, "selectedSignId": 1 } ] }
```

Response `data`: `QuizAttemptResponse` (đã có) — `{ attemptId, score, totalQuestions, correctAnswers, ... }`.

**3. (Tùy chọn) Lịch sử** — `GET /quizzes/history` (✔ auth) → `List<QuizAttemptResponse>`.

### BE — file cần tạo/sửa

| File | Việc |
| :--- | :--- |
| `dto/response/quiz/QuizQuestionResponse.java` | **Mới** — `signId, videoUrl, videoThumb, hint, List<Option> options, correctSignId` |
| `dto/request/quiz/QuizSubmitRequest.java` | **Sửa** — bỏ `score / correctAnswers / totalQuestions` (không tin client), thành `topicId, startedAt, List<Answer> answers` |
| `service/QuizService.java`, `service/impl/QuizServiceImpl.java` | **Mới** |
| `controller/QuizController.java` | **Mới** — `@RequestMapping("/api/v1/quizzes")`, viết theo mẫu `SignController` |

```java
@Override
@Transactional(readOnly = true)
public List<QuizQuestionResponse> generate(Long topicId, int count) {
    List<Sign> pool = topicId != null
            ? signRepository.findByTopic_TopicIdAndIsActive(topicId, true)
            : signRepository.findAll();
    List<Sign> questions = new ArrayList<>(pool);
    Collections.shuffle(questions);

    return questions.stream().limit(count).map(sign -> {
        List<Sign> options = pool.stream()
                .filter(s -> !s.getSignId().equals(sign.getSignId()))
                .collect(Collectors.toCollection(ArrayList::new));
        Collections.shuffle(options);
        options = new ArrayList<>(options.subList(0, Math.min(3, options.size())));
        options.add(sign);
        Collections.shuffle(options);

        return QuizQuestionResponse.builder()
                .signId(sign.getSignId())
                .videoUrl(sign.getVideoUrl())
                .videoThumb(sign.getVideoThumb())
                .hint(sign.getDescription())
                .options(options.stream()
                        .map(o -> new QuizQuestionResponse.Option(o.getSignId(), o.getNameVi()))
                        .toList())
                .correctSignId(sign.getSignId())
                .build();
    }).toList();
}

@Override
@Transactional
public QuizAttemptResponse submit(QuizSubmitRequest request, String email) {
    User user = requireUser(email);
    int correct = 0;

    for (QuizSubmitRequest.Answer a : request.getAnswers()) {
        boolean isCorrect = a.getSignId().equals(a.getSelectedSignId());
        if (isCorrect) correct++;
        updateProgress(user, a.getSignId(), isCorrect);
    }

    int total = request.getAnswers().size();
    QuizAttempt attempt = quizAttemptRepository.save(QuizAttempt.builder()
            .user(user)
            .topic(request.getTopicId() != null ? topicRepository.getReferenceById(request.getTopicId()) : null)
            .totalQuestions(total)
            .correctAnswers(correct)
            .score(BigDecimal.valueOf(total == 0 ? 0 : correct * 100.0 / total))
            .startedAt(request.getStartedAt())
            .completedAt(LocalDateTime.now())
            .build());

    user.setXp(user.getXp() + correct * 10);
    userRepository.save(user);
    return quizAttemptMapper.toQuizAttemptResponse(attempt);
}

// Đúng: +40 điểm thành thạo (tối đa 100), đạt >= 80 thì 'mastered'
// Sai:  -20 điểm (tối thiểu 0), chuyển 'review'
private void updateProgress(User user, Long signId, boolean isCorrect) {
    Sign sign = signRepository.findById(signId)
            .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
    LearningProgress p = progressRepository
            .findByUser_UserIdAndSign_SignId(user.getUserId(), signId)
            .orElseGet(() -> LearningProgress.builder().user(user).sign(sign).build());

    BigDecimal score = p.getMasteryScore().add(BigDecimal.valueOf(isCorrect ? 40 : -20))
            .max(BigDecimal.ZERO).min(BigDecimal.valueOf(100));
    p.setMasteryScore(score);
    p.setStatus(isCorrect && score.compareTo(BigDecimal.valueOf(80)) >= 0 ? "mastered" : "review");
    p.setLastStudiedAt(LocalDateTime.now());
    progressRepository.save(p);
}
```

### FE Mobile — `QuizScreen.js`
1. `apiClient.js`:

```js
export async function apiGenerateQuiz(topicId, count = 5) {
  const qs = new URLSearchParams({ count });
  if (topicId) qs.append('topicId', topicId);
  return (await request(`/quizzes/generate?${qs}`, { method: 'GET' }))?.data;
}

export async function apiSubmitQuiz(payload) {
  return (await request('/quizzes/submit', {
    method: 'POST', body: JSON.stringify(payload),
  }))?.data;
}
```

2. Trong `QuizScreen.js`: bỏ `buildQuestions` / `apiGetAllSigns`; khi mount gọi `apiGenerateQuiz(route.params?.topicId)` và map sang shape mà UI đang dùng:

```js
const toQuestion = (q) => ({
  id: `q_${q.signId}`,
  signId: q.signId,
  question: 'Ký hiệu trong video có ý nghĩa gì trong VSL?',
  videoThumb: q.videoThumb,
  hint: q.hint,
  options: q.options.map((o, i) => ({
    id: OPTION_IDS[i], text: o.text, signId: o.signId,
    isCorrect: o.signId === q.correctSignId,
  })),
  explanation: q.hint,
  points: POINTS_PER_QUESTION,
});
```

3. Ghi lại câu trả lời trong state `answers` (`{ signId, selectedSignId }`) ở `handleSelect`; lưu `startedAt` lúc tải đề.
4. Câu cuối → gọi `apiSubmitQuiz({ topicId, startedAt, answers })`, màn kết quả hiện `correctAnswers / totalQuestions` và `score` **từ response**.
5. (Tùy chọn) Thay ảnh câu hỏi bằng `VideoView` của CN-5.

### FE Web Portal
`01_kiem_tra_quiz/script.js` (hiện chưa gọi API): `api('/quizzes/generate?count=5')` → render câu hỏi → nộp `api('/quizzes/submit', { method: 'POST', body })`.

**Nghiệm thu:** làm 5 câu đúng 3 → `QUIZ_ATTEMPTS` có 1 dòng `correct_answers = 3`; 2 ký hiệu sai thành `review` và hiện ở "Từ cần ôn tập" (CN-2) cùng badge "Cần ôn tập" (CN-4).

---

## CN-7. Hồ sơ cá nhân

| | |
| :--- | :--- |
| Màn hình | `ProfileScreen.js` · Web `05_ho_so_ca_nhan_thanh_tich` |
| Hiện trạng | Đã gọi `/auth/me`; số từ thuần thục / độ chuẩn AI đang mượn từ `/dashboard`; Web Portal chưa gọi API |

### API

`GET /users/me/stats` (✔ auth)

```json
{ "masteredSigns": 2, "reviewSigns": 1, "totalPractices": 0,
  "aiAccuracy": null, "quizAttempts": 3, "avgQuizScore": 66.7 }
```

### BE
1. **Mới:** `dto/response/user/UserStatsResponse.java`, `controller/UserController.java` (`/api/v1/users`), thêm hàm `getMyStats(email)` vào `AuthService` hoặc `UserService` mới.
2. Repository:

```java
// PracticeAttemptRepository
long countByUser_UserId(Long userId);
// QuizAttemptRepository
long countByUser_UserId(Long userId);
@Query("select avg(q.score) from QuizAttempt q where q.user.userId = :userId")
BigDecimal averageScore(@Param("userId") Long userId);
```

`masteredSigns` / `reviewSigns` dùng `countByUser_UserIdAndStatus` đã có; `aiAccuracy` dùng `averageConfidence` của CN-2.

### FE Mobile — `ProfileScreen.js`
1. `apiClient.js`: `apiGetMyStats()` → `GET /users/me/stats`.
2. `fetchProfile`: thay `apiGetDashboard()` bằng `apiGetMyStats()`; ô "Ký hiệu đã thuộc" ← `masteredSigns`, "Độ chuẩn AI" ← `aiAccuracy` (null → `--`).
3. (Tùy chọn) thêm ô "Bài Quiz đã làm" ← `quizAttempts`, `avgQuizScore`.
4. Nút "Đăng xuất" → `await clearAuth()` (CN-1).

### FE Web Portal
`05_ho_so_ca_nhan_thanh_tich/script.js` (hiện chưa gọi API): `api('/auth/me')` + `api('/users/me/stats')`.

**Nghiệm thu:** sau khi làm Quiz, số từ thuần thục và số lượt Quiz khớp CSDL.

---

## CN-8. AI Camera — giữ mockup

Đúng phạm vi Phase 1 ([VSL-scope.md](VSL-scope.md)): không tích hợp camera / AI. Màn hình đã hiện đúng layout, tên ký hiệu mục tiêu, không có số liệu giả. Nút chụp báo "Chưa hỗ trợ".
Song song (không chặn Phase 1): dựng thử FastAPI + MediaPipe Hands chạy trên laptop để chuẩn bị Phase 2.

---

## Phân công & tiến độ đề xuất

| Đợt | Chức năng | Ghi chú |
| :--- | :--- | :--- |
| Đợt 1 | CN-0, CN-1 | Làm chung / 1 người; các chức năng khác phụ thuộc phần token và 401 |
| Đợt 2 | CN-6 (ưu tiên), CN-2, CN-3, CN-4, CN-5, CN-7 | Mỗi người nhận trọn 1–2 chức năng (BE → Mobile → Web Portal). **Chốt hợp đồng API trên Swagger trước khi code FE** |
| Đợt 3 | Kiểm thử chéo theo bảng nghiệm thu của từng CN | Chạy trên Expo web, Android thật (Expo Go cùng Wi-Fi) và Web Portal |

Tổng ước lượng: khoảng 15 ngày công (chưa tính thời gian quay video VSL).

## Rủi ro

| Rủi ro | Cách xử lý |
| :--- | :--- |
| Chưa có video VSL thật | Giao người chuẩn bị ngay đợt 1; tạm dùng video tự quay |
| CSDL dùng chung `sso.d2s.com.vn` — thành viên test ghi đè dữ liệu nhau | Mỗi người một tài khoản riêng; hoặc SQL Server local (Docker) khi dev |
| Điện thoại không gọi được BE | Cùng Wi-Fi, mạng không bật client isolation; dự phòng `adb reverse` / hotspot |
| Mobile và Web Portal lệch hợp đồng API | Swagger (`/swagger-ui.html`) là nguồn sự thật duy nhất |
| Tài liệu cũ ghi sai endpoint (`/api/...` thay vì `/api/v1/...`) và `content_type` (`sign/sentence` thay vì `single/phrases`) | Cập nhật lại VSL-phase.md / VSL-DB.md khi xong Phase 1 |
