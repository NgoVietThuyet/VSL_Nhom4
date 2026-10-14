package com.example.demo.service;

import com.example.demo.dto.request.auth.LoginRequest;
import com.example.demo.dto.request.auth.RegisterRequest;
import com.example.demo.dto.response.auth.AuthResponse;
import com.example.demo.dto.response.user.UserResponse;

import com.example.demo.dto.request.user.UpdateProfileRequest;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse register(RegisterRequest request);
    UserResponse getCurrentUser(String email);
    UserResponse updateProfile(String email, UpdateProfileRequest request);
}
