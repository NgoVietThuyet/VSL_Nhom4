package com.example.demo.mapper;

import com.example.demo.dto.response.practice.PracticeAttemptResponse;
import com.example.demo.entities.PracticeAttempt;
import org.springframework.stereotype.Component;

@Component
public class PracticeAttemptMapper {

    public PracticeAttemptResponse toPracticeAttemptResponse(PracticeAttempt attempt) {
        if (attempt == null) {
            return null;
        }

        Long userId = attempt.getUser() != null ? attempt.getUser().getUserId() : null;
        Long signId = attempt.getSign() != null ? attempt.getSign().getSignId() : null;
        String signNameVi = attempt.getSign() != null ? attempt.getSign().getNameVi() : null;

        return PracticeAttemptResponse.builder()
                .practiceId(attempt.getPracticeId())
                .userId(userId)
                .signId(signId)
                .signNameVi(signNameVi)
                .inputMode(attempt.getInputMode())
                .predictedLabel(attempt.getPredictedLabel())
                .confidence(attempt.getConfidence())
                .isCorrect(attempt.getIsCorrect())
                .createdAt(attempt.getCreatedAt())
                .build();
    }
}
