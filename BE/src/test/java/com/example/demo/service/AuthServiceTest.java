package com.example.demo.service;

import com.example.demo.dto.request.auth.LoginRequest;
import com.example.demo.dto.request.auth.RegisterRequest;
import com.example.demo.dto.response.auth.AuthResponse;
import com.example.demo.dto.response.user.UserResponse;
import com.example.demo.entities.User;
import com.example.demo.mapper.UserMapper;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.impl.AuthServiceImpl;
import com.example.demo.shared.exception.AppException;
import com.example.demo.shared.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private AuthServiceImpl authService;

    private RegisterRequest registerRequest;
    private User mockUser;
    private UserResponse mockUserResponse;

    @BeforeEach
    void setUp() {
        registerRequest = RegisterRequest.builder()
                .fullName("Nguyễn Văn An")
                .email("nguyenvanan@gmail.com")
                .password("password123")
                .phone("0987654321")
                .build();

        mockUser = User.builder()
                .userId(100L)
                .fullName("Nguyễn Văn An")
                .email("nguyenvanan@gmail.com")
                .passwordHash("password123")
                .phone("0987654321")
                .role("STUDENT")
                .xp(0)
                .level(1)
                .streakDays(1)
                .status(true)
                .build();

        mockUserResponse = UserResponse.builder()
                .userId(100L)
                .fullName("Nguyễn Văn An")
                .email("nguyenvanan@gmail.com")
                .phone("0987654321")
                .role("STUDENT")
                .build();
    }

    @Test
    @DisplayName("Đăng ký tài khoản thành công khi email chưa tồn tại")
    void register_Success() {
        // Arrange
        when(userRepository.existsByEmail("nguyenvanan@gmail.com")).thenReturn(false);
        when(userMapper.toEntity(registerRequest)).thenReturn(mockUser);
        when(userRepository.save(any(User.class))).thenReturn(mockUser);
        when(userMapper.toUserResponse(mockUser)).thenReturn(mockUserResponse);

        // Act
        AuthResponse response = authService.register(registerRequest);

        // Assert
        assertNotNull(response);
        assertEquals("100", response.getAccessToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals("nguyenvanan@gmail.com", response.getUser().getEmail());

        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Đăng ký thất bại khi email đã tồn tại")
    void register_DuplicateEmail_ThrowsException() {
        // Arrange
        when(userRepository.existsByEmail("nguyenvanan@gmail.com")).thenReturn(true);

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> authService.register(registerRequest));
        assertEquals(ErrorCode.USER_EXISTED, exception.getErrorCode());

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Đăng nhập thành công với thông tin chính xác")
    void login_Success() {
        // Arrange
        LoginRequest loginRequest = LoginRequest.builder()
                .email("nguyenvanan@gmail.com")
                .password("password123")
                .build();

        when(userRepository.findByEmail("nguyenvanan@gmail.com")).thenReturn(Optional.of(mockUser));
        when(userMapper.toUserResponse(mockUser)).thenReturn(mockUserResponse);

        // Act
        AuthResponse response = authService.login(loginRequest);

        // Assert
        assertNotNull(response);
        assertEquals("100", response.getAccessToken());
        assertEquals("nguyenvanan@gmail.com", response.getUser().getEmail());
    }

    @Test
    @DisplayName("Đăng nhập thất bại khi sai mật khẩu")
    void login_InvalidPassword_ThrowsException() {
        // Arrange
        LoginRequest loginRequest = LoginRequest.builder()
                .email("nguyenvanan@gmail.com")
                .password("wrongpassword")
                .build();

        when(userRepository.findByEmail("nguyenvanan@gmail.com")).thenReturn(Optional.of(mockUser));

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> authService.login(loginRequest));
        assertEquals(ErrorCode.INVALID_CREDENTIALS, exception.getErrorCode());
    }
}
