package com.example.demo.service.impl;

import com.example.demo.dto.request.auth.LoginRequest;
import com.example.demo.dto.request.auth.RegisterRequest;
import com.example.demo.dto.response.auth.AuthResponse;
import com.example.demo.dto.response.user.UserResponse;
import com.example.demo.entities.User;
import com.example.demo.mapper.UserMapper;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.AuthService;
import com.example.demo.shared.exception.AppException;
import com.example.demo.shared.exception.ErrorCode;
import com.example.demo.shared.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS, "Tài khoản hoặc mật khẩu không chính xác"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS, "Tài khoản hoặc mật khẩu không chính xác");
        }

        if (Boolean.FALSE.equals(user.getStatus())) {
            throw new AppException(ErrorCode.UNAUTHORIZED, "Tài khoản đã bị tạm khóa");
        }

        String accessToken = jwtService.generateAccessToken(user.getEmail(), user.getUserId(), user.getRole());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        log.info("Người dùng đăng nhập thành công: {}", user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(userMapper.toUserResponse(user))
                .build();
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new AppException(ErrorCode.USER_EXISTED, "Email đã được đăng ký trên hệ thống");
        }

        User user = userMapper.toEntity(request);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole("STUDENT");
        user.setXp(0);
        user.setLevel(1);
        user.setStreakDays(1);
        user.setStatus(true);

        User savedUser = userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(savedUser.getEmail(), savedUser.getUserId(), savedUser.getRole());
        String refreshToken = jwtService.generateRefreshToken(savedUser.getEmail());

        log.info("Tạo tài khoản mới thành công: {}", savedUser.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(userMapper.toUserResponse(savedUser))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = (email != null && !email.isBlank())
                ? userRepository.findByEmail(email).orElse(null)
                : null;
        if (user == null) {
            user = userRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED, "Không tìm thấy thông tin tài khoản"));
        }
        return userMapper.toUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(String email, com.example.demo.dto.request.user.UpdateProfileRequest request) {
        User user = (email != null && !email.isBlank())
                ? userRepository.findByEmail(email).orElse(null)
                : null;
        if (user == null) {
            user = userRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED, "Không tìm thấy thông tin tài khoản"));
        }
        userMapper.updateEntity(user, request);
        User savedUser = userRepository.save(user);
        log.info("Cập nhật thông tin tài khoản thành công: {}", savedUser.getEmail());
        return userMapper.toUserResponse(savedUser);
    }
}
