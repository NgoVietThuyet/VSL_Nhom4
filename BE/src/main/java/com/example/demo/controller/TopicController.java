package com.example.demo.controller;

import com.example.demo.dto.response.sign.SignResponse;
import com.example.demo.dto.response.topic.TopicResponse;
import com.example.demo.service.TopicService;
import com.example.demo.shared.response.CommonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/topics")
@RequiredArgsConstructor
@Tag(name = "Topic", description = "Các API quản lý và tra cứu Danh mục Chủ đề VSL")
public class TopicController {

    private final TopicService topicService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả chủ đề học tập", description = "Trả về danh sách chủ đề được sắp xếp theo thứ tự hiển thị")
    public ResponseEntity<CommonResponse<List<TopicResponse>>> getAllTopics() {
        List<TopicResponse> topics = topicService.getAllTopics();
        return ResponseEntity.ok(CommonResponse.success(topics, "Lấy danh sách chủ đề thành công"));
    }

    @GetMapping("/{topicId}")
    @Operation(summary = "Lấy thông tin chi tiết một chủ đề", description = "Tìm kiếm theo topicId")
    public ResponseEntity<CommonResponse<TopicResponse>> getTopicById(@PathVariable Long topicId) {
        TopicResponse topic = topicService.getTopicById(topicId);
        return ResponseEntity.ok(CommonResponse.success(topic, "Lấy thông tin chủ đề thành công"));
    }

    @GetMapping("/{topicId}/signs")
    @Operation(summary = "Lấy danh sách ký hiệu/từ vựng thuộc chủ đề", description = "Trả về danh sách từ vựng VSL trong chủ đề tương ứng")
    public ResponseEntity<CommonResponse<List<SignResponse>>> getSignsByTopic(
            @PathVariable Long topicId,
            Authentication authentication
    ) {
        String userEmail = authentication != null ? authentication.getName() : null;
        List<SignResponse> signs = topicService.getSignsByTopic(topicId, userEmail);
        return ResponseEntity.ok(CommonResponse.success(signs, "Lấy danh sách từ vựng thành công"));
    }
}
