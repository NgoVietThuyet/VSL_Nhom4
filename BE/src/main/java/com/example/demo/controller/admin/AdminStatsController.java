package com.example.demo.controller.admin;

import com.example.demo.dto.response.admin.AdminDashboardResponse;
import com.example.demo.service.admin.AdminStatsService;
import com.example.demo.shared.response.CommonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/stats")
@RequiredArgsConstructor
@Tag(name = "Admin Stats & Dashboard", description = "API Thống kê và Dashboard quản trị viên VSL")
public class AdminStatsController {

    private final AdminStatsService adminStatsService;

    @GetMapping("/dashboard")
    @Operation(summary = "Lấy toàn bộ chỉ số Dashboard và biểu đồ phân tích (Module 1)")
    public ResponseEntity<CommonResponse<AdminDashboardResponse>> getDashboardStats() {
        AdminDashboardResponse data = adminStatsService.getDashboardStats();
        return ResponseEntity.ok(CommonResponse.success(data, "Lấy số liệu Dashboard Admin thành công"));
    }
}
