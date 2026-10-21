package com.example.demo.controller.admin;

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

@RestController
@RequestMapping("/api/v1/admin/topics")
@RequiredArgsConstructor
@Tag(name = "Admin Topics", description = "Quản lý chủ đề bài học (Module 3)")
public class AdminTopicController {

    private final TopicRepository topicRepository;
    private final SignRepository signRepository;
    private final LessonRepository lessonRepository;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả chủ đề kèm số lượng ký hiệu")
    public ResponseEntity<CommonResponse<List<Map<String, Object>>>> listTopics() {
        List<Topic> topics = topicRepository.findAllByOrderByDisplayOrderAsc();
        Map<Long, Long> lessonCounts = new HashMap<>();
        for (Object[] row : lessonRepository.countByTopic()) {
            lessonCounts.put((Long) row[0], (Long) row[1]);
        }

        List<Map<String, Object>> res = topics.stream().map(t -> {
            Map<String, Object> map = toTopicMap(t);
            map.put("lessonsCount", lessonCounts.getOrDefault(t.getTopicId(), 0L));
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(CommonResponse.success(res, "Lấy danh sách chủ đề thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết chủ đề kèm số liệu bài học / ký hiệu")
    public ResponseEntity<CommonResponse<Map<String, Object>>> getTopic(@PathVariable Long id) {
        Topic t = topicRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy chủ đề"));

        var lessons = lessonRepository.findByTopic_TopicIdOrderByDisplayOrderAscLessonIdAsc(id);
        Map<String, Object> map = toTopicMap(t);
        map.put("lessonsCount", lessons.size());
        map.put("activeLessonsCount", lessons.stream().filter(l -> Boolean.TRUE.equals(l.getIsActive())).count());
        map.put("lessonsWithVideoCount", lessons.stream().filter(l -> l.getVideoUrl() != null && !l.getVideoUrl().isBlank()).count());
        map.put("unassignedSignsCount", signRepository.findByTopic_TopicIdAndLessonIsNullOrderBySignIdAsc(id).size());
        return ResponseEntity.ok(CommonResponse.success(map, "Lấy chi tiết chủ đề thành công"));
    }

    private Map<String, Object> toTopicMap(Topic t) {
        Map<String, Object> map = new HashMap<>();
        map.put("topicId", t.getTopicId());
        map.put("name", t.getName());
        map.put("emoji", t.getEmoji());
        map.put("level", t.getLevel());
        map.put("category", t.getCategory());
        map.put("description", t.getDescription());
        map.put("displayOrder", t.getDisplayOrder());
        map.put("isActive", t.getIsActive());
        map.put("createdAt", t.getCreatedAt());
        map.put("signsCount", signRepository.countByTopic_TopicIdAndIsActive(t.getTopicId(), true));
        return map;
    }

    @Data
    public static class TopicDto {
        private String name;
        private String emoji;
        private String level;
        private String category;
        private String description;
        private Integer displayOrder;
        private Boolean isActive;
    }

    @PostMapping
    @Operation(summary = "Thêm chủ đề mới")
    public ResponseEntity<CommonResponse<Topic>> createTopic(@RequestBody TopicDto req) {
        Topic t = Topic.builder()
                .name(req.getName().trim())
                .emoji(req.getEmoji() != null ? req.getEmoji() : "📚")
                .level(req.getLevel() != null ? req.getLevel() : "Cơ bản")
                .category(req.getCategory() != null ? req.getCategory() : "single")
                .description(req.getDescription())
                .displayOrder(req.getDisplayOrder() != null ? req.getDisplayOrder() : 0)
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .build();

        Topic saved = topicRepository.save(t);
        return ResponseEntity.ok(CommonResponse.success(saved, "Thêm chủ đề thành công"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật chủ đề")
    public ResponseEntity<CommonResponse<Topic>> updateTopic(@PathVariable Long id, @RequestBody TopicDto req) {
        Topic t = topicRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy chủ đề"));

        if (req.getName() != null) t.setName(req.getName().trim());
        if (req.getEmoji() != null) t.setEmoji(req.getEmoji());
        if (req.getLevel() != null) t.setLevel(req.getLevel());
        if (req.getCategory() != null) t.setCategory(req.getCategory());
        if (req.getDescription() != null) t.setDescription(req.getDescription());
        if (req.getDisplayOrder() != null) t.setDisplayOrder(req.getDisplayOrder());
        if (req.getIsActive() != null) t.setIsActive(req.getIsActive());

        Topic saved = topicRepository.save(t);
        return ResponseEntity.ok(CommonResponse.success(saved, "Cập nhật chủ đề thành công"));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Bật hoặc tắt trạng thái kích hoạt của chủ đề")
    public ResponseEntity<CommonResponse<Map<String, Object>>> toggleStatus(@PathVariable Long id) {
        Topic t = topicRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy chủ đề"));

        boolean newActive = !Boolean.TRUE.equals(t.getIsActive());
        t.setIsActive(newActive);
        topicRepository.save(t);

        Map<String, Object> map = new HashMap<>();
        map.put("topicId", id);
        map.put("isActive", newActive);
        return ResponseEntity.ok(CommonResponse.success(map, newActive ? "Đã kích hoạt chủ đề" : "Đã tạm ẩn chủ đề"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa chủ đề")
    public ResponseEntity<CommonResponse<Void>> deleteTopic(@PathVariable Long id) {
        Topic t = topicRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy chủ đề"));

        long count = signRepository.countByTopic_TopicIdAndIsActive(id, true);
        if (count > 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Không thể xóa chủ đề đang chứa ký hiệu từ vựng");
        }
        if (lessonRepository.countByTopic_TopicId(id) > 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Không thể xóa chủ đề đang chứa bài học");
        }

        topicRepository.delete(t);
        return ResponseEntity.ok(CommonResponse.success(null, "Xóa chủ đề thành công"));
    }
}
