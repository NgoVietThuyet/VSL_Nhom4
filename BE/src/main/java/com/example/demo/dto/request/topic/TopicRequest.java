package com.example.demo.dto.request.topic;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopicRequest {

    @NotBlank(message = "Tên chủ đề không được để trống")
    @Size(max = 150, message = "Tên chủ đề tối đa 150 ký tự")
    private String name;

    @Size(max = 10, message = "Emoji tối đa 10 ký tự")
    private String emoji;

    private String level;

    private String category;

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
    private String description;

    private Integer displayOrder;

    @Builder.Default
    private Boolean isActive = true;
}
