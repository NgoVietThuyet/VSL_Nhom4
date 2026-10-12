package com.example.demo.controller;

import com.example.demo.shared.response.CommonResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/public")
public class HealthCheckController {

    @GetMapping("/health")
    public ResponseEntity<CommonResponse<Map<String, Object>>> checkHealth() {
        Map<String, Object> healthInfo = new HashMap<>();
        healthInfo.put("status", "UP");
        healthInfo.put("application", "smr-backend");
        healthInfo.put("timestamp", LocalDateTime.now());
        healthInfo.put("database", "Connected (SQL Server - KLTNSMR)");

        return ResponseEntity.ok(CommonResponse.success(healthInfo, "Hệ thống Backend đang hoạt động bình thường"));
    }
}
