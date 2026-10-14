package com.example.demo.dto.response.dashboard;

import com.example.demo.dto.response.sign.SignResponse;
import com.example.demo.dto.response.topic.TopicResponse;
import com.example.demo.dto.response.user.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    private UserResponse user;
    private CourseOverview courseOverview;
    private TopicResponse currentTopic;
    private Integer currentTopicCompletedSigns;
    private Integer currentTopicProgress;
    private List<SignResponse> recommendedSigns;
    private List<SignResponse> reviewSigns;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseOverview {
        private String courseTitle;
        private String levelTitle;
        private Integer totalSigns;
        private Integer masteredSigns;
        private Integer totalPhrases;
        private Integer masteredPhrases;
        private Integer overallProgress;
        private Integer openTopicsCount;
        private Double aiAccuracy;
    }
}
