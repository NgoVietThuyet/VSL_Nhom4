package com.example.demo.dto.response.progress;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearningProgressResponse {

    private Long progressId;
    private Long userId;
    private Long signId;
    private String signNameVi;
    private String status;
    private BigDecimal masteryScore;
    private LocalDateTime lastStudiedAt;
    private LocalDateTime updatedAt;
}
