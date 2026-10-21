package com.example.demo.dto.request.sign;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignRequest {

    @NotNull(message = "topicId không được để trống")
    private Long topicId;

    @Builder.Default
    private String contentType = "sign";

    @NotBlank(message = "Tên từ/câu không được để trống")
    @Size(max = 200, message = "Tên từ/câu tối đa 200 ký tự")
    private String nameVi;

    private String duration;

    private String videoUrl;

    private String videoThumb;

    @Size(max = 1000, message = "Mô tả tối đa 1000 ký tự")
    private String description;

    private String stepsJson;

    @Size(max = 1000, message = "Lưu ý văn hóa tối đa 1000 ký tự")
    private String culturalNote;

    @Builder.Default
    private Integer difficulty = 1;

    @Builder.Default
    private Boolean isActive = true;
}
