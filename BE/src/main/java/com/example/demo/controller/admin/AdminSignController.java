package com.example.demo.controller.admin;

import com.example.demo.entities.Lesson;
import com.example.demo.entities.Sign;
import com.example.demo.entities.Topic;
import com.example.demo.repository.LessonRepository;
import com.example.demo.repository.SignRepository;
import com.example.demo.repository.TopicRepository;
import com.example.demo.shared.exception.AppException;
import com.example.demo.shared.exception.ErrorCode;
import com.example.demo.shared.response.CommonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/v1/admin/signs")
@RequiredArgsConstructor
@Transactional
@Tag(name = "Admin Signs", description = "Quản lý ký hiệu từ vựng & video (Module 4)")
public class AdminSignController {

    private final SignRepository signRepository;
    private final TopicRepository topicRepository;
    private final LessonRepository lessonRepository;

    @GetMapping
    @Operation(summary = "Lấy danh sách ký hiệu có bộ lọc tìm kiếm và chủ đề")
    public ResponseEntity<CommonResponse<List<Map<String, Object>>>> listSigns(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long topicId,
            @RequestParam(required = false) Long lessonId,
            @RequestParam(required = false) Integer difficulty,
            @RequestParam(required = false) Boolean isActive
    ) {
        List<Sign> signs = signRepository.findAll();

        if (search != null && !search.isBlank()) {
            String s = search.toLowerCase().trim();
            signs = signs.stream()
                    .filter(sign -> sign.getNameVi() != null && sign.getNameVi().toLowerCase().contains(s))
                    .collect(Collectors.toList());
        }

        if (topicId != null) {
            signs = signs.stream()
                    .filter(sign -> sign.getTopic() != null && sign.getTopic().getTopicId().equals(topicId))
                    .collect(Collectors.toList());
        }

        if (lessonId != null) {
            signs = signs.stream()
                    .filter(sign -> sign.getLesson() != null && sign.getLesson().getLessonId().equals(lessonId))
                    .collect(Collectors.toList());
        }

        if (difficulty != null) {
            signs = signs.stream()
                    .filter(sign -> sign.getDifficulty() != null && sign.getDifficulty().equals(difficulty))
                    .collect(Collectors.toList());
        }

        if (isActive != null) {
            signs = signs.stream()
                    .filter(sign -> sign.getIsActive() != null && sign.getIsActive().equals(isActive))
                    .collect(Collectors.toList());
        }

        List<Map<String, Object>> res = signs.stream().map(s -> {
            Map<String, Object> map = new HashMap<>();
            map.put("signId", s.getSignId());
            map.put("nameVi", s.getNameVi());
            map.put("contentType", s.getContentType());
            map.put("duration", s.getDuration());
            map.put("videoUrl", s.getVideoUrl());
            map.put("videoThumb", s.getVideoThumb());
            map.put("description", s.getDescription());
            map.put("stepsJson", s.getStepsJson());
            map.put("culturalNote", s.getCulturalNote());
            map.put("difficulty", s.getDifficulty());
            map.put("isActive", s.getIsActive());
            map.put("createdAt", s.getCreatedAt());
            if (s.getTopic() != null) {
                map.put("topicId", s.getTopic().getTopicId());
                map.put("topicName", s.getTopic().getName());
                map.put("topicEmoji", s.getTopic().getEmoji());
            }
            if (s.getLesson() != null) {
                map.put("lessonId", s.getLesson().getLessonId());
                map.put("lessonTitle", s.getLesson().getTitle());
            }
            map.put("displayOrder", s.getDisplayOrder());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(CommonResponse.success(res, "Lấy danh sách ký hiệu thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết ký hiệu")
    public ResponseEntity<CommonResponse<Sign>> getSignDetail(@PathVariable Long id) {
        Sign sign = signRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy ký hiệu"));
        return ResponseEntity.ok(CommonResponse.success(sign, "Lấy chi tiết ký hiệu thành công"));
    }

    @Data
    public static class SignDto {
        private Long topicId;
        private Long lessonId;
        // true = gỡ ký hiệu khỏi bài học hiện tại (lessonId null không đủ vì update là cập nhật một phần)
        private Boolean unassignLesson;
        private String contentType;
        private String nameVi;
        private String duration;
        private String videoUrl;
        private String videoThumb;
        private String description;
        private String stepsJson;
        private String culturalNote;
        private Integer difficulty;
        private Boolean isActive;
    }

    @PostMapping
    @Operation(summary = "Thêm ký hiệu mới")
    public ResponseEntity<CommonResponse<Sign>> createSign(@RequestBody SignDto req) {
        Topic topic = topicRepository.findById(req.getTopicId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy chủ đề"));

        Sign sign = Sign.builder()
                .topic(topic)
                .contentType(req.getContentType() != null ? req.getContentType() : "single")
                .nameVi(req.getNameVi().trim())
                .duration(req.getDuration() != null ? req.getDuration() : "0:03")
                .videoUrl(req.getVideoUrl())
                .videoThumb(req.getVideoThumb())
                .description(req.getDescription())
                .stepsJson(req.getStepsJson())
                .culturalNote(req.getCulturalNote())
                .difficulty(req.getDifficulty() != null ? req.getDifficulty() : 1)
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .build();

        if (req.getLessonId() != null) {
            Lesson lesson = findLessonInTopic(req.getLessonId(), topic.getTopicId());
            sign.setLesson(lesson);
            sign.setDisplayOrder(signRepository.findMaxDisplayOrderInLesson(lesson.getLessonId()) + 1);
        }

        Sign saved = signRepository.save(sign);
        return ResponseEntity.ok(CommonResponse.success(saved, "Thêm ký hiệu thành công"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật ký hiệu")
    public ResponseEntity<CommonResponse<Sign>> updateSign(@PathVariable Long id, @RequestBody SignDto req) {
        Sign sign = signRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy ký hiệu"));

        if (req.getTopicId() != null) {
            Topic topic = topicRepository.findById(req.getTopicId())
                    .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy chủ đề"));
            sign.setTopic(topic);
        }

        if (req.getLessonId() != null) {
            Lesson lesson = findLessonInTopic(req.getLessonId(), sign.getTopic().getTopicId());
            if (sign.getLesson() == null || !sign.getLesson().getLessonId().equals(lesson.getLessonId())) {
                sign.setLesson(lesson);
                sign.setDisplayOrder(signRepository.findMaxDisplayOrderInLesson(lesson.getLessonId()) + 1);
            }
        } else if (Boolean.TRUE.equals(req.getUnassignLesson())) {
            sign.setLesson(null);
            sign.setDisplayOrder(null);
        } else if (sign.getLesson() != null
                && !sign.getLesson().getTopic().getTopicId().equals(sign.getTopic().getTopicId())) {
            // Đổi sang chủ đề khác thì gỡ khỏi bài học cũ
            sign.setLesson(null);
            sign.setDisplayOrder(null);
        }

        if (req.getContentType() != null) sign.setContentType(req.getContentType());
        if (req.getNameVi() != null) sign.setNameVi(req.getNameVi().trim());
        if (req.getDuration() != null) sign.setDuration(req.getDuration());
        if (req.getVideoUrl() != null) sign.setVideoUrl(req.getVideoUrl());
        if (req.getVideoThumb() != null) sign.setVideoThumb(req.getVideoThumb());
        if (req.getDescription() != null) sign.setDescription(req.getDescription());
        if (req.getStepsJson() != null) sign.setStepsJson(req.getStepsJson());
        if (req.getCulturalNote() != null) sign.setCulturalNote(req.getCulturalNote());
        if (req.getDifficulty() != null) sign.setDifficulty(req.getDifficulty());
        if (req.getIsActive() != null) sign.setIsActive(req.getIsActive());

        Sign saved = signRepository.save(sign);
        return ResponseEntity.ok(CommonResponse.success(saved, "Cập nhật ký hiệu thành công"));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Bật hoặc tắt trạng thái kích hoạt của ký hiệu")
    public ResponseEntity<CommonResponse<Map<String, Object>>> toggleStatus(@PathVariable Long id) {
        Sign sign = signRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy ký hiệu"));

        boolean newActive = !Boolean.TRUE.equals(sign.getIsActive());
        sign.setIsActive(newActive);
        signRepository.save(sign);

        Map<String, Object> map = new HashMap<>();
        map.put("signId", id);
        map.put("isActive", newActive);
        return ResponseEntity.ok(CommonResponse.success(map, newActive ? "Đã kích hoạt ký hiệu" : "Đã tạm ẩn ký hiệu"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa ký hiệu")
    public ResponseEntity<CommonResponse<Void>> deleteSign(@PathVariable Long id) {
        Sign sign = signRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy ký hiệu"));

        signRepository.delete(sign);
        return ResponseEntity.ok(CommonResponse.success(null, "Xóa ký hiệu thành công"));
    }

    private Lesson findLessonInTopic(Long lessonId, Long topicId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bài học"));
        if (!lesson.getTopic().getTopicId().equals(topicId)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Bài học không thuộc chủ đề của ký hiệu");
        }
        return lesson;
    }
}
