package com.example.demo.shared.minio;

import com.example.demo.shared.exception.AppException;
import com.example.demo.shared.exception.ErrorCode;
import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class MinioService {

    private final MinioClient minioClient;
    private final MinioProperties minioProperties;

    public void ensureBucketExists() {
        try {
            String bucket = minioProperties.getBucketName();
            boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!found) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                // Cho phép đọc công khai để FE phát video / hiển thị ảnh qua URL trực tiếp
                String policy = """
                        {"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":["*"]},\
                        "Action":["s3:GetObject"],"Resource":["arn:aws:s3:::%s/*"]}]}""".formatted(bucket);
                minioClient.setBucketPolicy(SetBucketPolicyArgs.builder().bucket(bucket).config(policy).build());
                log.info("Bucket '{}' đã được khởi tạo thành công.", bucket);
            }
        } catch (Exception e) {
            log.error("Lỗi khi kiểm tra hoặc tạo bucket MinIO: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED, "Không thể kết nối hoặc khởi tạo MinIO bucket");
        }
    }

    public String uploadFile(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "File không được rỗng");
        }

        ensureBucketExists();

        try {
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String cleanFolder = folder != null ? folder.trim().replaceAll("^/+|/+$", "") : "";
            String uniqueName = UUID.randomUUID() + extension;
            String objectName = cleanFolder.isEmpty() ? uniqueName : cleanFolder + "/" + uniqueName;

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(minioProperties.getBucketName())
                            .object(objectName)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            log.info("Tải file lên MinIO thành công: {}", objectName);
            return getFileUrl(objectName);
        } catch (Exception e) {
            log.error("Lỗi khi upload file lên MinIO: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED, "Tải file lên MinIO thất bại: " + e.getMessage());
        }
    }

    public String uploadInputStream(InputStream stream, String objectName, String contentType, long size) {
        ensureBucketExists();
        try {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(minioProperties.getBucketName())
                            .object(objectName)
                            .stream(stream, size, -1)
                            .contentType(contentType)
                            .build()
            );
            return getFileUrl(objectName);
        } catch (Exception e) {
            log.error("Lỗi khi upload InputStream lên MinIO: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED, "Tải dữ liệu lên MinIO thất bại: " + e.getMessage());
        }
    }

    public InputStream downloadFile(String objectName) {
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(minioProperties.getBucketName())
                            .object(objectName)
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi khi tải file từ MinIO: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy file trên MinIO: " + objectName);
        }
    }

    public void deleteFile(String objectName) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(minioProperties.getBucketName())
                            .object(objectName)
                            .build()
            );
            log.info("Xóa file thành công khỏi MinIO: {}", objectName);
        } catch (Exception e) {
            log.error("Lỗi khi xóa file khỏi MinIO: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.FILE_DELETE_FAILED, "Không thể xóa file trên MinIO: " + objectName);
        }
    }

    /**
     * Trả về object name nếu URL thuộc bucket MinIO của hệ thống, ngược lại null (link ngoài).
     */
    public String extractObjectName(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) return null;
        String prefix = getFileUrl("");
        return fileUrl.startsWith(prefix) && fileUrl.length() > prefix.length()
                ? fileUrl.substring(prefix.length())
                : null;
    }

    /**
     * Xoá file theo URL nếu file nằm trên MinIO của hệ thống. Không ném lỗi — chỉ ghi log.
     */
    public void deleteByUrlQuietly(String fileUrl) {
        String objectName = extractObjectName(fileUrl);
        if (objectName == null) return;
        try {
            deleteFile(objectName);
        } catch (Exception e) {
            log.warn("Bỏ qua lỗi xoá file MinIO {}: {}", objectName, e.getMessage());
        }
    }

    public String getPresignedUrl(String objectName, int expiryMinutes) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(minioProperties.getBucketName())
                            .object(objectName)
                            .expiry(expiryMinutes, TimeUnit.MINUTES)
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi tạo Pre-signed URL từ MinIO: {}", e.getMessage(), e);
            return getFileUrl(objectName);
        }
    }

    public String getFileUrl(String objectName) {
        String scheme = minioProperties.isUseSsl() ? "https://" : "http://";
        String portStr = (minioProperties.getPort() == 80 || minioProperties.getPort() == 443)
                ? ""
                : ":" + minioProperties.getPort();

        return String.format("%s%s%s/%s/%s",
                scheme,
                minioProperties.getEndpoint(),
                portStr,
                minioProperties.getBucketName(),
                objectName
        );
    }
}
