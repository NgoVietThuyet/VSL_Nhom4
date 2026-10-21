package com.example.demo.entities;

import com.example.demo.entities.base.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Bài học trong một chủ đề. Mỗi bài có video hướng dẫn riêng và gom nhiều ký hiệu (SIGNS.lesson_id).
 */
@Entity
@Table(name = "LESSONS")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Lesson extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lesson_id")
    private Long lessonId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "objectives", length = 1000)
    private String objectives;

    @Column(name = "video_url", length = 500)
    private String videoUrl;

    @Column(name = "video_thumb", length = 500)
    private String videoThumb;

    @Column(name = "duration", length = 10)
    private String duration;

    @Builder.Default
    @Column(name = "difficulty", nullable = false)
    private Integer difficulty = 1;

    @Column(name = "estimated_minutes")
    private Integer estimatedMinutes;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @JsonIgnore
    @OneToMany(mappedBy = "lesson", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Sign> signs = new ArrayList<>();
}
