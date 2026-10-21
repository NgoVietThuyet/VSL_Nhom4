package com.example.demo.controller;

import com.example.demo.entities.LearningProgress;
import com.example.demo.entities.Lesson;
import com.example.demo.entities.User;
import com.example.demo.mapper.SignMapper;
import com.example.demo.repository.LearningProgressRepository;
import com.example.demo.repository.LessonRepository;
import com.example.demo.repository.SignRepository;
import com.example.demo.repository.TopicRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.shared.exception.AppException;
import com.example.demo.shared.exception.ErrorCode;
import com.example.demo.shared.response.CommonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Tag(name = "Lesson", description = "Bài học trong chủ đề (cho ứng dụng học viên)")
public class LessonController {

    private final TopicRepository topicRepository;
    private final LessonRepository lessonRepository;
    private final SignRepository signRepository;
    private final LearningProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final SignMapper signMapper;

    @GetMapping("/topics/{topicId}/lessons")
    @Operation(summary = "Danh sách bài học đang hiển thị của chủ đề",
            description = "Nếu kèm token, mỗi bài có thêm masteredCount và progress (%)")
    public ResponseEntity<CommonResponse<List<Map<String, Object>>>> getLessonsByTopic(@PathVariable Long topicId,
                                                                                      Authentication authentication) {
        if (!topicRepository.existsById(topicId)) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy chủ đề");
        }
        Long userId = resolveUserId(authentication);

        List<Map<String, Object>> res = lessonRepository
                .findByTopic_TopicIdAndIsActiveOrderByDisplayOrderAscLessonIdAsc(topicId, true)
                .stream()
                .map(l -> {
                    Map<String, Object> map = toLessonMap(l);
                    long total = signRepository.countByLesson_LessonIdAndIsActive(l.getLessonId(), true);
                    map.put("signsCount", total);
                    if (userId != null) {
                        long mastered = progressRepository.countByUser_UserIdAndStatusAndSign_Lesson_LessonIdAndSign_IsActive(
                                userId, "mastered", l.getLessonId(), true);
                        map.put("masteredCount", mastered);
                        map.put("progress", total > 0 ? Math.round(mastered * 100.0 / total) : 0);
                    }
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(CommonResponse.success(res, "Lấy danh sách bài học thành công"));
    }

    @GetMapping("/lessons/{lessonId}")
    @Operation(summary = "Chi tiết bài học kèm các ký hiệu (và trạng thái học nếu có token)")
    public ResponseEntity<CommonResponse<Map<String, Object>>> getLesson(@PathVariable Long lessonId,
                                                                        Authentication authentication) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .filter(l -> Boolean.TRUE.equals(l.getIsActive()))
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bài học"));
        Long userId = resolveUserId(authentication);

        Map<Long, LearningProgress> progressBySign = new HashMap<>();
        if (userId != null) {
            for (LearningProgress lp : progressRepository.findByUser_UserIdAndSign_Lesson_LessonId(userId, lessonId)) {
                progressBySign.put(lp.getSign().getSignId(), lp);
            }
        }

        List<Map<String, Object>> signs = signRepository
                .findByLesson_LessonIdAndIsActiveOrderByDisplayOrderAscSignIdAsc(lessonId, true)
                .stream()
                .map(s -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("sign", signMapper.toSignResponse(s));
                    LearningProgress lp = progressBySign.get(s.getSignId());
                    m.put("status", lp != null ? lp.getStatus() : "unlearned");
                    m.put("masteryScore", lp != null ? lp.getMasteryScore() : 0);
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> res = toLessonMap(lesson);
        res.put("topicName", lesson.getTopic().getName());
        res.put("topicEmoji", lesson.getTopic().getEmoji());
        res.put("signs", signs);
        return ResponseEntity.ok(CommonResponse.success(res, "Lấy chi tiết bài học thành công"));
    }

    private Long resolveUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) return null;
        return userRepository.findByEmail(authentication.getName()).map(User::getUserId).orElse(null);
    }

    private Map<String, Object> toLessonMap(Lesson l) {
        Map<String, Object> map = new HashMap<>();
        map.put("lessonId", l.getLessonId());
        map.put("topicId", l.getTopic().getTopicId());
        map.put("title", l.getTitle());
        map.put("description", l.getDescription());
        map.put("objectives", l.getObjectives());
        map.put("videoUrl", l.getVideoUrl());
        map.put("videoThumb", l.getVideoThumb());
        map.put("duration", l.getDuration());
        map.put("difficulty", l.getDifficulty());
        map.put("estimatedMinutes", l.getEstimatedMinutes());
        map.put("displayOrder", l.getDisplayOrder());
        return map;
    }
}
