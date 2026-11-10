package com.example.demo.controller.admin;

import com.example.demo.entities.PracticeAttempt;
import com.example.demo.entities.Sign;
import com.example.demo.repository.PracticeAttemptRepository;
import com.example.demo.repository.SignRepository;
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
@RequestMapping("/api/v1/admin/monitoring")
@RequiredArgsConstructor
@Tag(name = "Admin Monitoring", description = "Giám sát học tập và mô hình AI Camera (Module 6)")
public class AdminMonitoringController {

    private final PracticeAttemptRepository practiceAttemptRepository;
    private final SignRepository signRepository;

    @GetMapping("/overview")
    @Operation(summary = "Lấy các chỉ số tổng quan về giám sát mô hình AI")
    public ResponseEntity<CommonResponse<Map<String, Object>>> getOverview() {
        long totalPractices = practiceAttemptRepository.count();
        BigDecimal avgConf = practiceAttemptRepository.overallAverageConfidence();
        if (avgConf == null) {
            avgConf = BigDecimal.ZERO;
        }

        long correctCount = practiceAttemptRepository.countByIsCorrect(true);
        double successRate = totalPractices > 0 ? ((double) correctCount * 100.0 / totalPractices) : 0.0;
        BigDecimal successRateBd = BigDecimal.valueOf(successRate).setScale(1, RoundingMode.HALF_UP);

        Map<String, Object> map = new HashMap<>();
        map.put("totalPractices", totalPractices);
        map.put("avgConfidence", avgConf.multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP));
        map.put("successRate", successRateBd);
        map.put("fpsAverage", 30.0);
        map.put("latencyMs", 120);
        map.put("modelStatus", "HEALTHY");

        return ResponseEntity.ok(CommonResponse.success(map, "Lấy tổng quan giám sát thành công"));
    }

    @GetMapping("/ai-attempts")
    @Operation(summary = "Lấy danh sách các lượt thực hành AI gần nhất")
    public ResponseEntity<CommonResponse<List<Map<String, Object>>>> listAiAttempts(
            @RequestParam(required = false) Boolean isCorrect
    ) {
        List<PracticeAttempt> attempts = practiceAttemptRepository.findTop50ByOrderByCreatedAtDesc();

        if (isCorrect != null) {
            attempts = attempts.stream()
                    .filter(a -> a.getIsCorrect() != null && a.getIsCorrect().equals(isCorrect))
                    .collect(Collectors.toList());
        }

        List<Map<String, Object>> res = attempts.stream().map(a -> {
            Map<String, Object> map = new HashMap<>();
            map.put("practiceId", a.getPracticeId());
            map.put("inputMode", a.getInputMode());
            map.put("predictedLabel", a.getPredictedLabel());
            map.put("confidence", a.getConfidence());
            map.put("isCorrect", a.getIsCorrect());
            map.put("createdAt", a.getCreatedAt());
            if (a.getUser() != null) {
                map.put("userId", a.getUser().getUserId());
                map.put("userName", a.getUser().getFullName());
                map.put("userAvatar", a.getUser().getAvatarUrl());
            }
            if (a.getSign() != null) {
                map.put("signId", a.getSign().getSignId());
                map.put("signName", a.getSign().getNameVi());
                map.put("signThumb", a.getSign().getVideoThumb());
            }
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(CommonResponse.success(res, "Lấy danh sách thực hành AI thành công"));
    }

    @GetMapping("/hard-signs")
    @Operation(summary = "Lấy danh sách các ký hiệu có độ khó cao cần hỗ trợ học thêm")
    public ResponseEntity<CommonResponse<List<Map<String, Object>>>> listHardSigns() {
        List<Sign> signs = signRepository.findAll().stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsActive()))
                .collect(Collectors.toList());

        List<Map<String, Object>> res = signs.stream().map(s -> {
            long totalAttempts = practiceAttemptRepository.countBySign_SignId(s.getSignId());
            long correctAttempts = practiceAttemptRepository.countBySign_SignIdAndIsCorrect(s.getSignId(), true);
            long errorAttempts = totalAttempts - correctAttempts;
            double errorRate = totalAttempts > 0 ? ((double) errorAttempts * 100.0 / totalAttempts) : 0.0;
            double accuracy = totalAttempts > 0 ? ((double) correctAttempts * 100.0 / totalAttempts) : 0.0;

            Map<String, Object> map = new HashMap<>();
            map.put("signId", s.getSignId());
            map.put("nameVi", s.getNameVi());
            map.put("difficulty", s.getDifficulty() != null ? s.getDifficulty() : 1);
            map.put("topicName", s.getTopic() != null ? s.getTopic().getName() : "");
            map.put("totalAttempts", totalAttempts);
            map.put("errorRate", BigDecimal.valueOf(errorRate).setScale(1, RoundingMode.HALF_UP).doubleValue());
            map.put("avgAccuracy", BigDecimal.valueOf(accuracy).setScale(1, RoundingMode.HALF_UP).doubleValue());
            return map;
        })
        .sorted((a, b) -> Double.compare((Double) b.get("errorRate"), (Double) a.get("errorRate")))
        .limit(5)
        .collect(Collectors.toList());

        return ResponseEntity.ok(CommonResponse.success(res, "Lấy danh sách từ khó thành công"));
    }
}
