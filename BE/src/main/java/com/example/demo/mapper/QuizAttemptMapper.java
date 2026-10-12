package com.example.demo.mapper;

import com.example.demo.dto.response.quiz.QuizAttemptResponse;
import com.example.demo.entities.QuizAttempt;
import org.springframework.stereotype.Component;

@Component
public class QuizAttemptMapper {

    public QuizAttemptResponse toQuizAttemptResponse(QuizAttempt attempt) {
        if (attempt == null) {
            return null;
        }

        Long userId = attempt.getUser() != null ? attempt.getUser().getUserId() : null;
        Long topicId = attempt.getTopic() != null ? attempt.getTopic().getTopicId() : null;
        String topicName = attempt.getTopic() != null ? attempt.getTopic().getName() : null;

        return QuizAttemptResponse.builder()
                .attemptId(attempt.getAttemptId())
                .userId(userId)
                .topicId(topicId)
                .topicName(topicName)
                .score(attempt.getScore())
                .totalQuestions(attempt.getTotalQuestions())
                .correctAnswers(attempt.getCorrectAnswers())
                .startedAt(attempt.getStartedAt())
                .completedAt(attempt.getCompletedAt())
                .build();
    }
}
