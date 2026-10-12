package com.example.demo.mapper;

import com.example.demo.dto.response.progress.LearningProgressResponse;
import com.example.demo.entities.LearningProgress;
import org.springframework.stereotype.Component;

@Component
public class LearningProgressMapper {

    public LearningProgressResponse toLearningProgressResponse(LearningProgress progress) {
        if (progress == null) {
            return null;
        }

        Long userId = progress.getUser() != null ? progress.getUser().getUserId() : null;
        Long signId = progress.getSign() != null ? progress.getSign().getSignId() : null;
        String signNameVi = progress.getSign() != null ? progress.getSign().getNameVi() : null;

        return LearningProgressResponse.builder()
                .progressId(progress.getProgressId())
                .userId(userId)
                .signId(signId)
                .signNameVi(signNameVi)
                .status(progress.getStatus())
                .masteryScore(progress.getMasteryScore())
                .lastStudiedAt(progress.getLastStudiedAt())
                .updatedAt(progress.getUpdatedAt())
                .build();
    }
}
