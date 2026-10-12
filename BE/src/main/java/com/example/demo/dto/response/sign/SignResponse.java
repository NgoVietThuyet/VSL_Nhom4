package com.example.demo.dto.response.sign;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignResponse {

    private Long signId;
    private Long topicId;
    private String topicName;
    private String contentType;
    private String nameVi;
    private String ipa;
    private String englishName;
    private String duration;
    private String videoUrl;
    private String videoThumb;
    private String description;
    private String stepsJson;
    private String culturalNote;
    private Integer difficulty;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
