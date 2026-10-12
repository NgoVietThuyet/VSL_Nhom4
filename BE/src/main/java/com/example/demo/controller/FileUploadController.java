package com.example.demo.controller;

import com.example.demo.shared.minio.MinioService;
import com.example.demo.shared.response.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileUploadController {

    private final MinioService minioService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CommonResponse<Map<String, String>>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "uploads") String folder
    ) {
        String fileUrl = minioService.uploadFile(file, folder);

        Map<String, String> responseData = new HashMap<>();
        responseData.put("url", fileUrl);
        responseData.put("originalFilename", file.getOriginalFilename());
        responseData.put("contentType", file.getContentType());
        responseData.put("size", String.valueOf(file.getSize()));

        return ResponseEntity.ok(CommonResponse.success(responseData, "Tải tệp tin lên MinIO thành công"));
    }

    @DeleteMapping("/delete")
    public ResponseEntity<CommonResponse<Void>> deleteFile(@RequestParam("objectName") String objectName) {
        minioService.deleteFile(objectName);
        return ResponseEntity.ok(CommonResponse.success(null, "Xóa tệp tin khỏi MinIO thành công"));
    }
}
