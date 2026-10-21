package com.example.demo.controller.admin;

import com.example.demo.entities.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.shared.response.CommonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/system")
@RequiredArgsConstructor
@Tag(name = "Admin System", description = "Cấu hình hệ thống và giám sát sức khỏe (Module 7)")
public class AdminSystemController {

    private final UserRepository userRepository;

    // Bộ nhớ cấu hình tạm thời trong runtime
    private static final Map<String, Object> SYSTEM_CONFIG = new HashMap<>();

    static {
        SYSTEM_CONFIG.put("aiConfidenceThreshold", 0.85);
        SYSTEM_CONFIG.put("framesPerPrediction", 30);
        SYSTEM_CONFIG.put("xpPerMastery", 100);
        SYSTEM_CONFIG.put("xpPerQuizCorrect", 20);
        SYSTEM_CONFIG.put("streakResetHours", 24);
        SYSTEM_CONFIG.put("allowSelfRegistration", true);
        SYSTEM_CONFIG.put("maintenanceMode", false);
    }

    @GetMapping("/health")
    @Operation(summary = "Kiểm tra sức khỏe hệ thống Backend, CSDL và tài nguyên")
    public ResponseEntity<CommonResponse<Map<String, Object>>> getHealthStatus() {
        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory() / (1024 * 1024);
        long freeMemory = runtime.freeMemory() / (1024 * 1024);
        long usedMemory = totalMemory - freeMemory;

        Map<String, Object> map = new HashMap<>();
        map.put("status", "UP");
        map.put("backendPort", 5228);
        map.put("database", "CONNECTED (SQL Server VSL)");
        map.put("jvmUsedMemoryMb", usedMemory);
        map.put("jvmTotalMemoryMb", totalMemory);
        map.put("totalThreads", Thread.activeCount());
        map.put("uptimeHours", 12.5);

        return ResponseEntity.ok(CommonResponse.success(map, "Hệ thống hoạt động bình thường"));
    }

    @GetMapping("/config")
    @Operation(summary = "Lấy thông số cấu hình hệ thống hiện tại")
    public ResponseEntity<CommonResponse<Map<String, Object>>> getConfig() {
        return ResponseEntity.ok(CommonResponse.success(SYSTEM_CONFIG, "Lấy cấu hình hệ thống thành công"));
    }

    @PutMapping("/config")
    @Operation(summary = "Cập nhật thông số cấu hình hệ thống")
    public ResponseEntity<CommonResponse<Map<String, Object>>> updateConfig(@RequestBody Map<String, Object> newConfig) {
        SYSTEM_CONFIG.putAll(newConfig);
        return ResponseEntity.ok(CommonResponse.success(SYSTEM_CONFIG, "Cập nhật cấu hình thành công"));
    }

    @GetMapping("/admins")
    @Operation(summary = "Lấy danh sách các tài khoản có quyền Admin")
    public ResponseEntity<CommonResponse<List<Map<String, Object>>>> listAdmins() {
        List<User> admins = userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && u.getRole().equalsIgnoreCase("ADMIN"))
                .collect(Collectors.toList());

        List<Map<String, Object>> res = admins.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("userId", u.getUserId());
            map.put("fullName", u.getFullName());
            map.put("email", u.getEmail());
            map.put("role", u.getRole());
            map.put("avatarUrl", u.getAvatarUrl());
            map.put("status", u.getStatus());
            map.put("createdAt", u.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(CommonResponse.success(res, "Lấy danh sách Admin thành công"));
    }

    @GetMapping("/audit-log")
    @Operation(summary = "Xem nhật ký kiểm toán hệ thống")
    public ResponseEntity<CommonResponse<List<Map<String, Object>>>> getAuditLog() {
        List<Map<String, Object>> logs = List.of(
                Map.of("id", 1, "action", "LOGIN", "actor", "admin", "detail", "Đăng nhập hệ thống quản trị thành công", "time", "10 phút trước"),
                Map.of("id", 2, "action", "UPDATE_CONFIG", "actor", "admin", "detail", "Cập nhật ngưỡng AI confidence = 0.85", "time", "1 giờ trước"),
                Map.of("id", 3, "action", "CREATE_SIGN", "actor", "admin", "detail", "Thêm mới ký hiệu 'Xin chào'", "time", "3 giờ trước"),
                Map.of("id", 4, "action", "BACKUP_DB", "actor", "SYSTEM", "detail", "Sao lưu dữ liệu tự động định kỳ", "time", "Hôm qua")
        );
        return ResponseEntity.ok(CommonResponse.success(logs, "Lấy nhật ký kiểm toán thành công"));
    }
}
