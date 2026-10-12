package com.example.demo.dto.request.quiz;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
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
public class QuizSubmitRequest {

    private Long topicId;

    @NotNull(message = "Điểm số không được để trống")
    @DecimalMin(value = "0.0", message = "Điểm số tối thiểu 0.0")
    @DecimalMax(value = "100.0", message = "Điểm số tối đa 100.0")
    private BigDecimal score;

    @NotNull(message = "Tổng số câu hỏi không được để trống")
    @Min(value = 1, message = "Tổng số câu hỏi tối thiểu là 1")
    private Integer totalQuestions;

    @NotNull(message = "Số câu trả lời đúng không được để trống")
    @Min(value = 0, message = "Số câu đúng không được âm")
    private Integer correctAnswers;

    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}
