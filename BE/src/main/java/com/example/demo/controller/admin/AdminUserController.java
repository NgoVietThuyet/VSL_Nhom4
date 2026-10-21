package com.example.demo.controller.admin;

import com.example.demo.entities.User;
import com.example.demo.repository.LearningProgressRepository;
import com.example.demo.repository.PracticeAttemptRepository;
import com.example.demo.repository.QuizAttemptRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.shared.exception.AppException;
import com.example.demo.shared.exception.ErrorCode;
import com.example.demo.shared.response.CommonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@Tag(name = "Admin Users", description = "Quản lý người dùng (Module 2)")
public class AdminUserController {

    private final UserRepository userRepository;
    private final LearningProgressRepository progressRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final PracticeAttemptRepository practiceAttemptRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    @Operation(summary = "Lấy danh sách người dùng với bộ lọc tìm kiếm và vai trò")
    public ResponseEntity<CommonResponse<List<Map<String, Object>>>> listUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean status
    ) {
        List<User> users = userRepository.findAll();

        if (search != null && !search.isBlank()) {
            String s = search.toLowerCase().trim();
            users = users.stream()
                    .filter(u -> (u.getFullName() != null && u.getFullName().toLowerCase().contains(s)) ||
                                 (u.getEmail() != null && u.getEmail().toLowerCase().contains(s)) ||
                                 (u.getPhone() != null && u.getPhone().contains(s)))
                    .collect(Collectors.toList());
        }

        if (role != null && !role.isBlank()) {
            users = users.stream()
                    .filter(u -> u.getRole() != null && u.getRole().equalsIgnoreCase(role))
                    .collect(Collectors.toList());
        }

        if (status != null) {
            users = users.stream()
                    .filter(u -> u.getStatus() != null && u.getStatus().equals(status))
                    .collect(Collectors.toList());
        }

        List<Map<String, Object>> response = users.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("userId", u.getUserId());
            map.put("fullName", u.getFullName());
            map.put("email", u.getEmail());
            map.put("phone", u.getPhone());
            map.put("avatarUrl", u.getAvatarUrl());
            map.put("role", u.getRole());
            map.put("xp", u.getXp());
            map.put("level", u.getLevel());
            map.put("streakDays", u.getStreakDays());
            map.put("status", u.getStatus());
            map.put("createdAt", u.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(CommonResponse.success(response, "Lấy danh sách người dùng thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin chi tiết và hồ sơ học tập của người dùng")
    public ResponseEntity<CommonResponse<Map<String, Object>>> getUserDetail(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED, "Không tìm thấy người dùng"));

        long masteredCount = progressRepository.countByUser_UserIdAndStatus(id, "mastered");
        long reviewCount = progressRepository.countByUser_UserIdAndStatus(id, "review");
        var quizHistory = quizAttemptRepository.findByUser_UserIdOrderByStartedAtDesc(id);
        var practiceHistory = practiceAttemptRepository.findByUser_UserIdOrderByCreatedAtDesc(id);

        Map<String, Object> data = new HashMap<>();
        data.put("user", user);
        data.put("masteredCount", masteredCount);
        data.put("reviewCount", reviewCount);
        data.put("quizHistory", quizHistory.stream().limit(10).collect(Collectors.toList()));
        data.put("practiceHistory", practiceHistory.stream().limit(10).collect(Collectors.toList()));

        return ResponseEntity.ok(CommonResponse.success(data, "Lấy chi tiết người dùng thành công"));
    }

    @Data
    public static class UserCreateRequest {
        private String fullName;
        private String email;
        private String password;
        private String phone;
        private String avatarUrl;
        private String role;
        private Integer level;
    }

    @PostMapping
    @Operation(summary = "Thêm người dùng mới")
    public ResponseEntity<CommonResponse<User>> createUser(@RequestBody UserCreateRequest req) {
        if (userRepository.existsByEmail(req.getEmail().trim().toLowerCase())) {
            throw new AppException(ErrorCode.USER_EXISTED, "Email đã tồn tại trên hệ thống");
        }

        User u = User.builder()
                .fullName(req.getFullName().trim())
                .email(req.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(req.getPassword() != null && !req.getPassword().isBlank() ? req.getPassword() : "123456"))
                .phone(req.getPhone())
                .avatarUrl(req.getAvatarUrl() != null && !req.getAvatarUrl().isBlank() ? req.getAvatarUrl() : "https://ui-avatars.com/api/?name=" + req.getFullName())
                .role(req.getRole() != null ? req.getRole().toUpperCase() : "STUDENT")
                .level(req.getLevel() != null ? req.getLevel() : 1)
                .xp(0)
                .streakDays(1)
                .status(true)
                .build();

        User saved = userRepository.save(u);
        return ResponseEntity.ok(CommonResponse.success(saved, "Tạo người dùng thành công"));
    }

    @Data
    public static class UserUpdateRequest {
        private String fullName;
        private String phone;
        private String avatarUrl;
        private String role;
        private Integer level;
        private Integer xp;
        private Integer streakDays;
        private Boolean status;
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin người dùng")
    public ResponseEntity<CommonResponse<User>> updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED, "Không tìm thấy người dùng"));

        if (req.getFullName() != null) user.setFullName(req.getFullName().trim());
        if (req.getPhone() != null) user.setPhone(req.getPhone());
        if (req.getAvatarUrl() != null) user.setAvatarUrl(req.getAvatarUrl());
        if (req.getRole() != null) user.setRole(req.getRole().toUpperCase());
        if (req.getLevel() != null) user.setLevel(req.getLevel());
        if (req.getXp() != null) user.setXp(req.getXp());
        if (req.getStreakDays() != null) user.setStreakDays(req.getStreakDays());
        if (req.getStatus() != null) user.setStatus(req.getStatus());

        User saved = userRepository.save(user);
        return ResponseEntity.ok(CommonResponse.success(saved, "Cập nhật người dùng thành công"));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Khóa hoặc mở khóa tài khoản người dùng")
    public ResponseEntity<CommonResponse<Map<String, Object>>> toggleStatus(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED, "Không tìm thấy người dùng"));

        boolean newStatus = !Boolean.TRUE.equals(user.getStatus());
        user.setStatus(newStatus);
        userRepository.save(user);

        Map<String, Object> res = new HashMap<>();
        res.put("userId", id);
        res.put("status", newStatus);
        res.put("message", newStatus ? "Đã mở khóa tài khoản" : "Đã tạm khóa tài khoản");

        return ResponseEntity.ok(CommonResponse.success(res, (String) res.get("message")));
    }

    @PostMapping("/{id}/reset-password")
    @Operation(summary = "Reset mật khẩu người dùng")
    public ResponseEntity<CommonResponse<String>> resetPassword(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED, "Không tìm thấy người dùng"));

        String newPass = (body != null && body.containsKey("newPassword")) ? body.get("newPassword") : "123456";
        user.setPasswordHash(passwordEncoder.encode(newPass));
        userRepository.save(user);

        return ResponseEntity.ok(CommonResponse.success(newPass, "Đặt lại mật khẩu thành công"));
    }
}
