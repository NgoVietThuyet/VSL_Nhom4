package com.example.demo.entities;

import com.example.demo.entities.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "PRACTICE_ATTEMPTS")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PracticeAttempt extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "practice_id")
    private Long practiceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sign_id", nullable = false)
    private Sign sign;

    @Builder.Default
    @Column(name = "input_mode", nullable = false, length = 20)
    private String inputMode = "camera"; // camera / upload

    @Column(name = "predicted_label", length = 200)
    private String predictedLabel;

    @Column(name = "confidence", precision = 6, scale = 5)
    private BigDecimal confidence;

    @Builder.Default
    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect = false;
}
