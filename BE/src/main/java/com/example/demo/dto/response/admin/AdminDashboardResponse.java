package com.example.demo.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponse {

    // 1. KPI Cards
    private KpiStats kpis;

    // 2. Charts
    private ChartData charts;

    // 3. Recent Activities
    private List<RecentActivityItem> recentActivities;

    // 4. Leaderboard
    private List<LeaderboardItem> leaderboard;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpiStats {
        private long totalStudents;
        private long activeToday;
        private long totalTopics;
        private long totalSigns;
        private BigDecimal avgMasteryScore;
        private long todayAiPractices;
        private BigDecimal avgAiConfidence;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChartData {
        private List<DayActivity> dailyActivities;
        private List<TopicPracticeCount> topicPractices;
        private List<LevelDistribution> levelDistribution;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DayActivity {
        private String date; // YYYY-MM-DD
        private long practiceCount;
        private long quizCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopicPracticeCount {
        private Long topicId;
        private String topicName;
        private String emoji;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LevelDistribution {
        private String levelName;
        private long userCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivityItem {
        private String id;
        private String type; // REGISTER, PRACTICE, QUIZ, MASTERY
        private String userName;
        private String userAvatar;
        private String description;
        private String timeAgo;
        private String status; // SUCCESS, WARNING, INFO
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeaderboardItem {
        private Long rank;
        private Long userId;
        private String userName;
        private String userAvatar;
        private Integer level;
        private Integer xp;
        private Integer streakDays;
    }
}
