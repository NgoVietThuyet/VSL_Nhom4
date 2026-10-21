package com.example.demo.controller.admin;

import com.example.demo.shared.exception.AppException;
import com.example.demo.shared.exception.ErrorCode;
import com.example.demo.shared.minio.MinioService;
import com.example.demo.shared.response.CommonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/admin/files")
@RequiredArgsConstructor
@Tag(name = "Admin Files", description = "Upload video / ảnh bìa bài học lên MinIO")
public class AdminFileController {

    private static final Set<String> VIDEO_TYPES = Set.of("video/mp4", "video/webm", "video/quicktime");
    private static final Set<String> IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_VIDEO_BYTES = 200L * 1024 * 1024;
    private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;

    private final MinioService minioService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload video (mp4/webm/mov, ≤200MB) hoặc ảnh (jpg/png/webp, ≤5MB)",
            description = "kind = video | image. File được lưu vào thư mục lessons/videos hoặc lessons/thumbs.")
    public ResponseEntity<CommonResponse<Map<String, String>>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "kind", defaultValue = "video") String kind
    ) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "File không được rỗng");
        }
        String type = file.getContentType() != null ? file.getContentType().toLowerCase() : "";

        String folder;
        if ("image".equalsIgnoreCase(kind)) {
            if (!IMAGE_TYPES.contains(type)) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "Ảnh bìa chỉ hỗ trợ JPG, PNG hoặc WEBP");
            }
            if (file.getSize() > MAX_IMAGE_BYTES) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "Ảnh bìa tối đa 5MB");
            }
            folder = "lessons/thumbs";
        } else {
            if (!VIDEO_TYPES.contains(type)) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "Video chỉ hỗ trợ MP4, WEBM hoặc MOV");
            }
            if (file.getSize() > MAX_VIDEO_BYTES) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "Video tối đa 200MB");
            }
            folder = "lessons/videos";
        }

        String url = minioService.uploadFile(file, folder);

        Map<String, String> res = new HashMap<>();
        res.put("url", url);
        res.put("originalFilename", file.getOriginalFilename());
        res.put("contentType", type);
        res.put("size", String.valueOf(file.getSize()));
        return ResponseEntity.ok(CommonResponse.success(res, "Tải tệp lên thành công"));
    }

    @DeleteMapping
    @Operation(summary = "Xoá file đã upload (theo URL) — dùng khi admin huỷ form sau khi đã upload")
    public ResponseEntity<CommonResponse<Void>> delete(@RequestParam("url") String url) {
        if (minioService.extractObjectName(url) == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "URL không thuộc kho lưu trữ của hệ thống");
        }
        minioService.deleteByUrlQuietly(url);
        return ResponseEntity.ok(CommonResponse.success(null, "Đã xoá tệp"));
    }
}
