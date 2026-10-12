package com.example.demo.entities;

import com.example.demo.entities.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "SIGNS")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Sign extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sign_id")
    private Long signId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @Builder.Default
    @Column(name = "content_type", nullable = false, length = 20)
    private String contentType = "sign";

    @Column(name = "name_vi", nullable = false, length = 200)
    private String nameVi;

    @Column(name = "ipa", length = 100)
    private String ipa;

    @Column(name = "english_name", length = 200)
    private String englishName;

    @Column(name = "duration", length = 10)
    private String duration;

    @Column(name = "video_url", length = 500)
    private String videoUrl;

    @Column(name = "video_thumb", length = 500)
    private String videoThumb;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "steps_json", columnDefinition = "NVARCHAR(MAX)")
    private String stepsJson;

    @Column(name = "cultural_note", length = 1000)
    private String culturalNote;

    @Builder.Default
    @Column(name = "difficulty", nullable = false)
    private Integer difficulty = 1;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
