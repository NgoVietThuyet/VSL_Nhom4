package com.example.demo.controller;

import com.example.demo.dto.response.dashboard.DashboardResponse;
import com.example.demo.service.DashboardService;
import com.example.demo.shared.response.CommonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Các API phục vụ Màn hình Trang Chủ & Tiến Độ")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    @Operation(summary = "Lấy dữ liệu trang chủ & tiến độ học tập", description = "Trả về thông tin người dùng, chủ đề đang học, tiến độ và danh sách từ vựng ôn tập")
    public ResponseEntity<CommonResponse<DashboardResponse>> getDashboard(Authentication authentication) {
        String userEmail = authentication != null ? authentication.getName() : null;
        DashboardResponse response = dashboardService.getDashboardData(userEmail);
        return ResponseEntity.ok(CommonResponse.success(response, "Lấy dữ liệu trang chủ thành công"));
    }
}
