package com.example.demo.shared.jwt;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "smr.jwt")
public class JwtProperties {
    private String key;
    private String issuer;
    private String audience;
    private long accessTokenExpirationMinutes = 1440;
    private long refreshTokenExpirationDays = 7;
    private long resetTokenExpirationMinutes = 15;
}
