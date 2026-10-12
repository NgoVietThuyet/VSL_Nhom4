package com.example.demo.mapper;

import com.example.demo.dto.request.auth.RegisterRequest;
import com.example.demo.dto.request.user.UpdateProfileRequest;
import com.example.demo.dto.response.user.UserResponse;
import com.example.demo.entities.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toUserResponse(User user) {
        if (user == null) {
            return null;
        }

        return UserResponse.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .xp(user.getXp())
                .level(user.getLevel())
                .streakDays(user.getStreakDays())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public User toEntity(RegisterRequest request) {
        if (request == null) {
            return null;
        }

        return User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .role("STUDENT")
                .xp(0)
                .level(1)
                .streakDays(0)
                .status(true)
                .build();
    }

    public void updateEntity(User user, UpdateProfileRequest request) {
        if (user == null || request == null) {
            return;
        }

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
    }
}
