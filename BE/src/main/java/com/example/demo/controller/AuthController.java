package com.example.demo.controller;

import com.example.demo.dto.request.auth.LoginRequest;
import com.example.demo.dto.request.auth.RegisterRequest;
import com.example.demo.dto.response.auth.AuthResponse;
import com.example.demo.dto.response.user.UserResponse;
import com.example.demo.service.AuthService;
import com.example.demo.shared.response.CommonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Các API xác thực tài khoản và phân quyền")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập tài khoản", description = "Nhận email và mật khẩu, trả về JWT access token")
    public ResponseEntity<CommonResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(CommonResponse.success(response, "Đăng nhập thành công"));
    }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản mới", description = "Tạo tài khoản học viên VSL mới")
    public ResponseEntity<CommonResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(CommonResponse.success(response, "Đăng ký tài khoản thành công"));
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin tài khoản hiện tại", description = "Dựa trên Bearer token được gửi trong header")
    public ResponseEntity<CommonResponse<UserResponse>> getProfile(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        UserResponse userResponse = authService.getCurrentUser(email);
        return ResponseEntity.ok(CommonResponse.success(userResponse, "Lấy thông tin tài khoản thành công"));
    }

    @PutMapping("/profile")
    @Operation(summary = "Cập nhật thông tin tài khoản", description = "Cập nhật họ tên, số điện thoại, avatarUrl")
    public ResponseEntity<CommonResponse<UserResponse>> updateProfile(
            @Valid @RequestBody com.example.demo.dto.request.user.UpdateProfileRequest request,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : null;
        UserResponse userResponse = authService.updateProfile(email, request);
        return ResponseEntity.ok(CommonResponse.success(userResponse, "Cập nhật thông tin thành công"));
    }
}
