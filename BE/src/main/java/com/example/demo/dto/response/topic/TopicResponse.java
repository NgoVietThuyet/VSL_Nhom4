package com.example.demo.dto.response.topic;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopicResponse {

    private Long topicId;
    private String name;
    private String emoji;
    private String level;
    private String category;
    private String description;
    private Integer displayOrder;
    private Boolean isActive;
    private Integer signCount;
    private LocalDateTime createdAt;

    // Tiến độ cá nhân: chỉ có giá trị khi request kèm token
    private Integer masteredCount;
    private Integer progress;
}
