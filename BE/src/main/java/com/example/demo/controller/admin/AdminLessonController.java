package com.example.demo.controller.admin;

import com.example.demo.entities.Lesson;
import com.example.demo.entities.Sign;
import com.example.demo.entities.Topic;
import com.example.demo.repository.LessonRepository;
import com.example.demo.repository.SignRepository;
import com.example.demo.repository.TopicRepository;
import com.example.demo.shared.exception.AppException;
import com.example.demo.shared.exception.ErrorCode;
import com.example.demo.shared.minio.MinioService;
import com.example.demo.shared.response.CommonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Transactional
@Tag(name = "Admin Lessons", description = "Quản lý bài học trong từng chủ đề")
public class AdminLessonController {

    private final TopicRepository topicRepository;
    private final LessonRepository lessonRepository;
    private final SignRepository signRepository;
    private final MinioService minioService;

    @Data
    public static class LessonDto {
        private String title;
        private String description;
        private String objectives;
        private String videoUrl;
        private String videoThumb;
        private String duration;
        private Integer difficulty;
        private Integer estimatedMinutes;
        private Integer displayOrder;
        private Boolean isActive;
    }

    @Data
    public static class IdListDto {
        private List<Long> ids;
    }

    // ───────────── Danh sách / tạo bài học trong chủ đề ─────────────

    @GetMapping("/topics/{topicId}/lessons")
    @Operation(summary = "Danh sách bài học của chủ đề (theo thứ tự hiển thị)")
    public ResponseEntity<CommonResponse<List<Map<String, Object>>>> listLessons(@PathVariable Long topicId) {
        findTopic(topicId);
        List<Map<String, Object>> res = lessonRepository.findByTopic_TopicIdOrderByDisplayOrderAscLessonIdAsc(topicId)
                .stream()
                .map(this::toLessonMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(CommonResponse.success(res, "Lấy danh sách bài học thành công"));
    }

    @PostMapping("/topics/{topicId}/lessons")
    @Operation(summary = "Tạo bài học mới trong chủ đề")
    public ResponseEntity<CommonResponse<Map<String, Object>>> createLesson(@PathVariable Long topicId,
                                                                           @RequestBody LessonDto req) {
        Topic topic = findTopic(topicId);
        if (req.getTitle() == null || req.getTitle().isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Tên bài học không được để trống");
        }

        Integer order = req.getDisplayOrder() != null
                ? req.getDisplayOrder()
                : lessonRepository.findMaxDisplayOrder(topicId) + 1;

        Lesson lesson = Lesson.builder()
                .topic(topic)
                .title(req.getTitle().trim())
                .description(req.getDescription())
                .objectives(req.getObjectives())
                .videoUrl(blankToNull(req.getVideoUrl()))
                .videoThumb(blankToNull(req.getVideoThumb()))
                .duration(req.getDuration())
                .difficulty(req.getDifficulty() != null ? req.getDifficulty() : 1)
                .estimatedMinutes(req.getEstimatedMinutes())
                .displayOrder(order)
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .build();

        Lesson saved = lessonRepository.save(lesson);
        return ResponseEntity.ok(CommonResponse.success(toLessonMap(saved), "Tạo bài học thành công"));
    }

    @PutMapping("/topics/{topicId}/lessons/order")
    @Operation(summary = "Sắp xếp lại thứ tự bài học trong chủ đề", description = "Body: { ids: [lessonId theo thứ tự mới] }")
    public ResponseEntity<CommonResponse<Void>> reorderLessons(@PathVariable Long topicId, @RequestBody IdListDto req) {
        findTopic(topicId);
        Map<Long, Lesson> lessons = lessonRepository.findByTopic_TopicIdOrderByDisplayOrderAscLessonIdAsc(topicId)
                .stream()
                .collect(Collectors.toMap(Lesson::getLessonId, l -> l));

        List<Long> ids = req.getIds() != null ? req.getIds() : List.of();
        int order = 1;
        for (Long id : ids) {
            Lesson l = lessons.get(id);
            if (l == null) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "Bài học " + id + " không thuộc chủ đề này");
            }
            l.setDisplayOrder(order++);
        }
        lessonRepository.saveAll(lessons.values());
        return ResponseEntity.ok(CommonResponse.success(null, "Đã cập nhật thứ tự bài học"));
    }

    // ───────────── Chi tiết / sửa / xoá bài học ─────────────

    @GetMapping("/lessons/{id}")
    @Operation(summary = "Chi tiết bài học kèm danh sách ký hiệu và ký hiệu chưa gán trong chủ đề")
    public ResponseEntity<CommonResponse<Map<String, Object>>> getLesson(@PathVariable Long id) {
        Lesson lesson = findLesson(id);
        Topic topic = lesson.getTopic();

        Map<String, Object> res = toLessonMap(lesson);
        res.put("topicName", topic.getName());
        res.put("topicEmoji", topic.getEmoji());
        res.put("signs", signRepository.findByLesson_LessonIdOrderByDisplayOrderAscSignIdAsc(id)
                .stream().map(this::toSignMap).collect(Collectors.toList()));
        res.put("unassignedSigns", signRepository.findByTopic_TopicIdAndLessonIsNullOrderBySignIdAsc(topic.getTopicId())
                .stream().map(this::toSignMap).collect(Collectors.toList()));
        return ResponseEntity.ok(CommonResponse.success(res, "Lấy chi tiết bài học thành công"));
    }

    @PutMapping("/lessons/{id}")
    @Operation(summary = "Cập nhật bài học")
    public ResponseEntity<CommonResponse<Map<String, Object>>> updateLesson(@PathVariable Long id, @RequestBody LessonDto req) {
        Lesson lesson = findLesson(id);

        if (req.getTitle() != null) {
            if (req.getTitle().isBlank()) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "Tên bài học không được để trống");
            }
            lesson.setTitle(req.getTitle().trim());
        }
        if (req.getDescription() != null) lesson.setDescription(req.getDescription());
        if (req.getObjectives() != null) lesson.setObjectives(req.getObjectives());
        if (req.getVideoUrl() != null) {
            String newUrl = blankToNull(req.getVideoUrl());
            if (!Objects.equals(newUrl, lesson.getVideoUrl())) {
                minioService.deleteByUrlQuietly(lesson.getVideoUrl());
            }
            lesson.setVideoUrl(newUrl);
        }
        if (req.getVideoThumb() != null) {
            String newThumb = blankToNull(req.getVideoThumb());
            if (!Objects.equals(newThumb, lesson.getVideoThumb())) {
                minioService.deleteByUrlQuietly(lesson.getVideoThumb());
            }
            lesson.setVideoThumb(newThumb);
        }
        if (req.getDuration() != null) lesson.setDuration(req.getDuration());
        if (req.getDifficulty() != null) lesson.setDifficulty(req.getDifficulty());
        if (req.getEstimatedMinutes() != null) lesson.setEstimatedMinutes(req.getEstimatedMinutes());
        if (req.getDisplayOrder() != null) lesson.setDisplayOrder(req.getDisplayOrder());
        if (req.getIsActive() != null) lesson.setIsActive(req.getIsActive());

        Lesson saved = lessonRepository.save(lesson);
        return ResponseEntity.ok(CommonResponse.success(toLessonMap(saved), "Cập nhật bài học thành công"));
    }

    @PatchMapping("/lessons/{id}/status")
    @Operation(summary = "Bật / tắt hiển thị bài học")
    public ResponseEntity<CommonResponse<Map<String, Object>>> toggleStatus(@PathVariable Long id) {
        Lesson lesson = findLesson(id);
        boolean newActive = !Boolean.TRUE.equals(lesson.getIsActive());
        lesson.setIsActive(newActive);
        lessonRepository.save(lesson);

        Map<String, Object> map = new HashMap<>();
        map.put("lessonId", id);
        map.put("isActive", newActive);
        return ResponseEntity.ok(CommonResponse.success(map, newActive ? "Đã hiển thị bài học" : "Đã tạm ẩn bài học"));
    }

    @DeleteMapping("/lessons/{id}")
    @Operation(summary = "Xoá bài học (chỉ khi bài không còn ký hiệu)")
    public ResponseEntity<CommonResponse<Void>> deleteLesson(@PathVariable Long id) {
        Lesson lesson = findLesson(id);
        long count = signRepository.countByLesson_LessonId(id);
        if (count > 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST,
                    "Bài học đang chứa " + count + " ký hiệu. Hãy gỡ hoặc chuyển các ký hiệu trước khi xoá.");
        }

        minioService.deleteByUrlQuietly(lesson.getVideoUrl());
        minioService.deleteByUrlQuietly(lesson.getVideoThumb());
        lessonRepository.delete(lesson);
        return ResponseEntity.ok(CommonResponse.success(null, "Xoá bài học thành công"));
    }

    // ───────────── Ký hiệu trong bài học ─────────────

    @PutMapping("/lessons/{id}/signs")
    @Operation(summary = "Đặt danh sách ký hiệu của bài học",
            description = "Body: { ids: [signId theo thứ tự] }. Ký hiệu có trong danh sách được gán vào bài theo đúng thứ tự; "
                    + "ký hiệu đang thuộc bài nhưng không có trong danh sách sẽ được gỡ ra (trở về 'chưa gán').")
    public ResponseEntity<CommonResponse<List<Map<String, Object>>>> setLessonSigns(@PathVariable Long id,
                                                                                   @RequestBody IdListDto req) {
        Lesson lesson = findLesson(id);
        Long topicId = lesson.getTopic().getTopicId();
        List<Long> ids = req.getIds() != null ? req.getIds() : List.of();

        Map<Long, Sign> topicSigns = signRepository.findByTopic_TopicIdOrderBySignIdAsc(topicId)
                .stream()
                .collect(Collectors.toMap(Sign::getSignId, s -> s));

        List<Sign> changed = new ArrayList<>();
        Set<Long> keep = new HashSet<>(ids);

        // Gỡ các ký hiệu không còn trong danh sách
        for (Sign s : signRepository.findByLesson_LessonIdOrderByDisplayOrderAscSignIdAsc(id)) {
            if (!keep.contains(s.getSignId())) {
                s.setLesson(null);
                s.setDisplayOrder(null);
                changed.add(s);
            }
        }

        int order = 1;
        for (Long signId : ids) {
            Sign s = topicSigns.get(signId);
            if (s == null) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "Ký hiệu " + signId + " không thuộc chủ đề của bài học");
            }
            if (s.getLesson() != null && !s.getLesson().getLessonId().equals(id)) {
                throw new AppException(ErrorCode.INVALID_REQUEST,
                        "Ký hiệu \"" + s.getNameVi() + "\" đang thuộc bài học khác");
            }
            s.setLesson(lesson);
            s.setDisplayOrder(order++);
            changed.add(s);
        }
        signRepository.saveAll(changed);

        List<Map<String, Object>> res = signRepository.findByLesson_LessonIdOrderByDisplayOrderAscSignIdAsc(id)
                .stream().map(this::toSignMap).collect(Collectors.toList());
        return ResponseEntity.ok(CommonResponse.success(res, "Đã cập nhật ký hiệu của bài học"));
    }

    // ───────────── Helpers ─────────────

    private Topic findTopic(Long topicId) {
        return topicRepository.findById(topicId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy chủ đề"));
    }

    private Lesson findLesson(Long id) {
        return lessonRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bài học"));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
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
        map.put("isActive", l.getIsActive());
        map.put("createdAt", l.getCreatedAt());
        map.put("updatedAt", l.getUpdatedAt());
        map.put("signsCount", l.getLessonId() != null ? signRepository.countByLesson_LessonId(l.getLessonId()) : 0);
        return map;
    }

    private Map<String, Object> toSignMap(Sign s) {
        Map<String, Object> map = new HashMap<>();
        map.put("signId", s.getSignId());
        map.put("nameVi", s.getNameVi());
        map.put("contentType", s.getContentType());
        map.put("duration", s.getDuration());
        map.put("videoUrl", s.getVideoUrl());
        map.put("videoThumb", s.getVideoThumb());
        map.put("difficulty", s.getDifficulty());
        map.put("isActive", s.getIsActive());
        map.put("displayOrder", s.getDisplayOrder());
        return map;
    }
}
