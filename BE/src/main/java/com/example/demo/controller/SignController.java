package com.example.demo.controller;

import com.example.demo.dto.request.practice.PracticeSubmitRequest;
import com.example.demo.dto.request.progress.ProgressUpdateRequest;
import com.example.demo.dto.response.practice.PracticeAttemptResponse;
import com.example.demo.dto.response.progress.LearningProgressResponse;
import com.example.demo.dto.response.sign.SignResponse;
import com.example.demo.service.SignService;
import com.example.demo.shared.response.CommonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/signs")
@RequiredArgsConstructor
@Tag(name = "Sign", description = "Các API tra cứu ký hiệu VSL, video hướng dẫn và luyện tập nhận diện cử chỉ AI")
public class SignController {

    private final SignService signService;

    @GetMapping
    @Operation(summary = "Lấy danh sách ký hiệu VSL", description = "Hỗ trợ tìm kiếm theo từ khóa hoặc lọc theo chủ đề")
    public ResponseEntity<CommonResponse<List<SignResponse>>> getAllSigns(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long topicId
    ) {
        List<SignResponse> signs = signService.getAllSigns(search, topicId);
        return ResponseEntity.ok(CommonResponse.success(signs, "Lấy danh sách ký hiệu thành công"));
    }

    @GetMapping("/{signId}")
    @Operation(summary = "Lấy chi tiết một ký hiệu VSL", description = "Bao gồm video hướng dẫn, các bước thực hiện và ghi chú văn hoá")
    public ResponseEntity<CommonResponse<SignResponse>> getSignById(@PathVariable Long signId) {
        SignResponse sign = signService.getSignById(signId);
        return ResponseEntity.ok(CommonResponse.success(sign, "Lấy chi tiết ký hiệu thành công"));
    }

    @PostMapping("/{signId}/practice")
    @Operation(summary = "Gửi kết quả luyện tập nhận diện cử chỉ AI", description = "Lưu lượt nhận diện từ camera AI, cộng điểm XP và cập nhật tiến độ học tập")
    public ResponseEntity<CommonResponse<PracticeAttemptResponse>> submitPractice(
            @PathVariable Long signId,
            @Valid @RequestBody PracticeSubmitRequest request,
            Authentication authentication
    ) {
        String userEmail = authentication != null ? authentication.getName() : null;
        PracticeAttemptResponse response = signService.submitPractice(signId, request, userEmail);
        return ResponseEntity.ok(CommonResponse.success(response, "Ghi nhận kết quả luyện tập thành công"));
    }

    @PostMapping("/{signId}/progress")
    @Operation(summary = "Cập nhật trạng thái tiến độ học ký hiệu", description = "Đánh dấu trạng thái unlearned, review hoặc mastered")
    public ResponseEntity<CommonResponse<LearningProgressResponse>> updateProgress(
            @PathVariable Long signId,
            @Valid @RequestBody ProgressUpdateRequest request,
            Authentication authentication
    ) {
        String userEmail = authentication != null ? authentication.getName() : null;
        LearningProgressResponse response = signService.updateProgress(signId, request, userEmail);
        return ResponseEntity.ok(CommonResponse.success(response, "Cập nhật tiến độ học thành công"));
    }
}
