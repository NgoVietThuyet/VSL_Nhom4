package com.example.demo.entities;

import com.example.demo.entities.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "LEARNING_PROGRESS")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearningProgress extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "progress_id")
    private Long progressId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sign_id", nullable = false)
    private Sign sign;

    @Builder.Default
    @Column(name = "status", nullable = false, length = 20)
    private String status = "unlearned"; // unlearned / review / mastered

    @Builder.Default
    @Column(name = "mastery_score", precision = 5, scale = 2)
    private BigDecimal masteryScore = BigDecimal.ZERO;

    @Column(name = "last_studied_at")
    private LocalDateTime lastStudiedAt;
}
