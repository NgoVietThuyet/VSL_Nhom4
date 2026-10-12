package com.example.demo.dto.request.progress;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
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
public class ProgressUpdateRequest {

    @NotNull(message = "signId không được để trống")
    private Long signId;

    @NotBlank(message = "Trạng thái không được để trống")
    private String status; // unlearned / review / mastered

    @DecimalMin(value = "0.0", message = "Điểm thành thạo tối thiểu 0.0")
    @DecimalMax(value = "100.0", message = "Điểm thành thạo tối đa 100.0")
    private BigDecimal masteryScore;
}
