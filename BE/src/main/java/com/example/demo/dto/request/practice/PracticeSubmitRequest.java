package com.example.demo.dto.request.practice;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PracticeSubmitRequest {

    @NotNull(message = "signId không được để trống")
    private Long signId;

    @Builder.Default
    private String inputMode = "camera"; // camera / upload

    private String predictedLabel;

    @DecimalMin(value = "0.0", message = "Độ tin cậy tối thiểu 0.0")
    @DecimalMax(value = "1.0", message = "Độ tin cậy tối đa 1.0")
    private BigDecimal confidence;

    @NotNull(message = "Kết quả đúng/sai không được để trống")
    private Boolean isCorrect;
}
