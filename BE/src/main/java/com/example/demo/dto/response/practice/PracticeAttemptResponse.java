package com.example.demo.dto.response.practice;

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
public class PracticeAttemptResponse {

    private Long practiceId;
    private Long userId;
    private Long signId;
    private String signNameVi;
    private String inputMode;
    private String predictedLabel;
    private BigDecimal confidence;
    private Boolean isCorrect;
    private LocalDateTime createdAt;
}
