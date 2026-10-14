package com.example.demo.service;

import com.example.demo.dto.response.dashboard.DashboardResponse;

public interface DashboardService {
    DashboardResponse getDashboardData(String userEmail);
}
