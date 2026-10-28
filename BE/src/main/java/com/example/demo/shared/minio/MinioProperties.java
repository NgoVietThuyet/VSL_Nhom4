package com.example.demo.shared.minio;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "smr.minio")
public class MinioProperties {
    private String endpoint = "minio.d2s.vn";
    private int port = 443;
    private String accessKey = "admin";
    private String secretKey = "admin123";
    private boolean useSsl = true;
    private String bucketName = "vsl";
}
