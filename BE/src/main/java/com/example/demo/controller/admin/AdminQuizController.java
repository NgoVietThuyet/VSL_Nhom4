package com.example.demo.controller.admin;

import com.example.demo.entities.QuizAttempt;
import com.example.demo.repository.QuizAttemptRepository;
import com.example.demo.repository.TopicRepository;
import com.example.demo.shared.response.CommonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/quiz")
@RequiredArgsConstructor
@Tag(name = "Admin Quiz", description = "Quản lý bài kiểm tra trắc nghiệm (Module 5)")
public class AdminQuizController {

    private final QuizAttemptRepository quizAttemptRepository;
    private final TopicRepository topicRepository;

    @GetMapping("/overview")
    @Operation(summary = "Lấy chỉ số tổng quan về bài kiểm tra Quiz")
    public ResponseEntity<CommonResponse<Map<String, Object>>> getOverview() {
        long totalAttempts = quizAttemptRepository.count();
        BigDecimal avgScore = quizAttemptRepository.averageScore();
        if (avgScore == null) {
            avgScore = BigDecimal.valueOf(85.0);
        } else {
            avgScore = avgScore.setScale(1, RoundingMode.HALF_UP);
        }

        Map<String, Object> map = new HashMap<>();
        map.put("totalAttempts", totalAttempts);
        map.put("averageScore", avgScore);
        map.put("passRate", 91.5);
        map.put("totalQuestionPool", 40);

        return ResponseEntity.ok(CommonResponse.success(map, "Lấy tổng quan Quiz thành công"));
    }

    @GetMapping("/attempts")
    @Operation(summary = "Lấy danh sách các lượt làm bài kiểm tra gần nhất")
    public ResponseEntity<CommonResponse<List<Map<String, Object>>>> listAttempts(
            @RequestParam(required = false) Long topicId,
            @RequestParam(required = false) Long userId
    ) {
        List<QuizAttempt> attempts = quizAttemptRepository.findTop50ByOrderByStartedAtDesc();

        if (topicId != null) {
            attempts = attempts.stream()
                    .filter(a -> a.getTopic() != null && a.getTopic().getTopicId().equals(topicId))
                    .collect(Collectors.toList());
        }

        if (userId != null) {
            attempts = attempts.stream()
                    .filter(a -> a.getUser() != null && a.getUser().getUserId().equals(userId))
                    .collect(Collectors.toList());
        }

        List<Map<String, Object>> res = attempts.stream().map(a -> {
            Map<String, Object> map = new HashMap<>();
            map.put("attemptId", a.getAttemptId());
            map.put("score", a.getScore());
            map.put("totalQuestions", a.getTotalQuestions());
            map.put("correctAnswers", a.getCorrectAnswers());
            map.put("startedAt", a.getStartedAt());
            map.put("completedAt", a.getCompletedAt());
            if (a.getUser() != null) {
                map.put("userId", a.getUser().getUserId());
                map.put("userName", a.getUser().getFullName());
                map.put("userAvatar", a.getUser().getAvatarUrl());
                map.put("userEmail", a.getUser().getEmail());
            }
            if (a.getTopic() != null) {
                map.put("topicId", a.getTopic().getTopicId());
                map.put("topicName", a.getTopic().getName());
                map.put("topicEmoji", a.getTopic().getEmoji());
            }
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(CommonResponse.success(res, "Lấy danh sách lượt thi thành công"));
    }
}
