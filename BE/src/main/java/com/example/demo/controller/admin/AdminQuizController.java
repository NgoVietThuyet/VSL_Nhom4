package com.example.demo.controller.admin;

import com.example.demo.entities.QuizAttempt;
import com.example.demo.entities.Sign;
import com.example.demo.repository.QuizAttemptRepository;
import com.example.demo.repository.SignRepository;
import com.example.demo.repository.TopicRepository;
import com.example.demo.shared.response.CommonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/quiz")
@RequiredArgsConstructor
@Tag(name = "Admin Quiz", description = "Quản lý bài kiểm tra trắc nghiệm (Module 5)")
public class AdminQuizController {

    private final QuizAttemptRepository quizAttemptRepository;
    private final TopicRepository topicRepository;
    private final SignRepository signRepository;

    @GetMapping("/overview")
    @Operation(summary = "Lấy chỉ số tổng quan về bài kiểm tra Quiz")
    public ResponseEntity<CommonResponse<Map<String, Object>>> getOverview() {
        long totalAttempts = quizAttemptRepository.count();
        BigDecimal avgScore = quizAttemptRepository.averageScore();
        if (avgScore == null) {
            avgScore = BigDecimal.ZERO;
        } else {
            avgScore = avgScore.setScale(1, RoundingMode.HALF_UP);
        }

        long passedAttempts = quizAttemptRepository.countByScoreGreaterThanEqual(BigDecimal.valueOf(80));
        double passRate = totalAttempts > 0 ? ((double) passedAttempts * 100.0 / totalAttempts) : 0.0;
        BigDecimal passRateBd = BigDecimal.valueOf(passRate).setScale(1, RoundingMode.HALF_UP);

        long totalQuestionPool = signRepository.countByIsActive(true);

        Map<String, Object> map = new HashMap<>();
        map.put("totalAttempts", totalAttempts);
        map.put("averageScore", avgScore);
        map.put("passRate", passRateBd);
        map.put("totalQuestionPool", totalQuestionPool);

        return ResponseEntity.ok(CommonResponse.success(map, "Lấy tổng quan Quiz thành công"));
    }

    @GetMapping("/questions")
    @Operation(summary = "Lấy danh sách câu hỏi trắc nghiệm được sinh từ các ký hiệu trong hệ thống")
    public ResponseEntity<CommonResponse<List<Map<String, Object>>>> getQuestions(
            @RequestParam(required = false) Long topicId
    ) {
        List<Sign> signs = topicId != null
                ? signRepository.findByTopic_TopicIdAndIsActive(topicId, true)
                : signRepository.findAll().stream().filter(s -> Boolean.TRUE.equals(s.getIsActive())).collect(Collectors.toList());

        List<Sign> allActive = signRepository.findAll().stream().filter(s -> Boolean.TRUE.equals(s.getIsActive())).collect(Collectors.toList());

        List<Map<String, Object>> questions = new ArrayList<>();
        int qId = 1;
        for (Sign s : signs) {
            String topicName = s.getTopic() != null ? s.getTopic().getName() : "VSL";
            String question = "Cử chỉ của ký hiệu \"" + s.getNameVi() + "\" trong từ điển VSL mô tả ý nghĩa nào?";

            List<String> distractors = allActive.stream()
                    .filter(other -> !other.getSignId().equals(s.getSignId()))
                    .map(Sign::getNameVi)
                    .distinct()
                    .collect(Collectors.toList());
            Collections.shuffle(distractors);

            List<String> options = new ArrayList<>();
            options.add(s.getNameVi());
            for (int i = 0; i < Math.min(3, distractors.size()); i++) {
                options.add(distractors.get(i));
            }
            Collections.shuffle(options);

            List<String> labeledOptions = new ArrayList<>();
            String correctAnswer = "";
            char label = 'A';
            for (String opt : options) {
                String fullOpt = label + ". " + opt;
                labeledOptions.add(fullOpt);
                if (opt.equals(s.getNameVi())) {
                    correctAnswer = fullOpt;
                }
                label++;
            }

            Map<String, Object> qMap = new HashMap<>();
            qMap.put("id", qId++);
            qMap.put("signId", s.getSignId());
            qMap.put("topicName", topicName);
            qMap.put("question", question);
            qMap.put("options", labeledOptions);
            qMap.put("correctAnswer", correctAnswer);
            qMap.put("explanation", s.getDescription() != null && !s.getDescription().isBlank()
                    ? s.getDescription()
                    : "Đây là ký hiệu chuẩn trong chủ đề " + topicName + ".");

            questions.add(qMap);
            if (questions.size() >= 20) break;
        }

        return ResponseEntity.ok(CommonResponse.success(questions, "Lấy danh sách câu hỏi thành công"));
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
