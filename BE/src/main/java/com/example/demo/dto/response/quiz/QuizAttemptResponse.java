package com.example.demo.dto.response.quiz;

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
public class QuizAttemptResponse {

    private Long attemptId;
    private Long userId;
    private Long topicId;
    private String topicName;
    private BigDecimal score;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}
