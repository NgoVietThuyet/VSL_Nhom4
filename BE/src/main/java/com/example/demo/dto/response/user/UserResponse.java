package com.example.demo.dto.response.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long userId;
    private String fullName;
    private String email;
    private String phone;
    private String avatarUrl;
    private String role;
    private Integer xp;
    private Integer level;
    private Integer streakDays;
    private Boolean status;
    private LocalDateTime createdAt;
}
