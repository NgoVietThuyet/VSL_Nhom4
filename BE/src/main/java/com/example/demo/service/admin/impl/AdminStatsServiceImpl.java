package com.example.demo.service.admin.impl;

import com.example.demo.dto.response.admin.AdminDashboardResponse;
import com.example.demo.dto.response.admin.AdminDashboardResponse.*;
import com.example.demo.entities.PracticeAttempt;
import com.example.demo.entities.Topic;
import com.example.demo.entities.User;
import com.example.demo.repository.*;
import com.example.demo.service.admin.AdminStatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminStatsServiceImpl implements AdminStatsService {

    private final UserRepository userRepository;
    private final TopicRepository topicRepository;
    private final SignRepository signRepository;
    private final LearningProgressRepository progressRepository;
    private final PracticeAttemptRepository practiceAttemptRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboardStats() {
        // 1. KPI Stats
        long totalStudents = userRepository.count();
        long activeToday = userRepository.findAll().stream()
                .filter(u -> u.getStreakDays() != null && u.getStreakDays() > 0)
                .count();
        long totalTopics = topicRepository.count();
        long totalSigns = signRepository.count();

        BigDecimal avgMastery = progressRepository.averageMasteryScore();
        if (avgMastery == null) {
            avgMastery = BigDecimal.ZERO;
        } else {
            avgMastery = avgMastery.setScale(1, RoundingMode.HALF_UP);
        }

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        long todayPractices = practiceAttemptRepository.countByCreatedAtAfter(startOfToday);

        BigDecimal avgConfidence = practiceAttemptRepository.overallAverageConfidence();
        if (avgConfidence == null) {
            avgConfidence = BigDecimal.ZERO;
        }

        KpiStats kpiStats = KpiStats.builder()
                .totalStudents(totalStudents)
                .activeToday(activeToday)
                .totalTopics(totalTopics)
                .totalSigns(totalSigns)
                .avgMasteryScore(avgMastery)
                .todayAiPractices(todayPractices)
                .avgAiConfidence(avgConfidence.multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP))
                .build();

        // 2. Chart: 7 ngày gần nhất
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM");
        List<DayActivity> dailyActivities = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            LocalDateTime startOfDay = day.atStartOfDay();
            LocalDateTime endOfDay = day.atTime(java.time.LocalTime.MAX);
            long pCount = practiceAttemptRepository.countByCreatedAtBetween(startOfDay, endOfDay);
            long qCount = quizAttemptRepository.countByStartedAtBetween(startOfDay, endOfDay);
            dailyActivities.add(DayActivity.builder()
                    .date(day.format(dtf))
                    .practiceCount(pCount)
                    .quizCount(qCount)
                    .build());
        }

        // Chart: Lượt thực hành theo từng chủ đề
        List<Topic> topics = topicRepository.findAll();
        List<TopicPracticeCount> topicPractices = topics.stream()
                .map(t -> TopicPracticeCount.builder()
                        .topicId(t.getTopicId())
                        .topicName(t.getName())
                        .emoji(t.getEmoji() != null ? t.getEmoji() : "📚")
                        .count(practiceAttemptRepository.countBySign_Topic_TopicId(t.getTopicId()))
                        .build())
                .collect(Collectors.toList());

        // Chart: Phân bổ cấp độ học viên
        List<User> allUsers = userRepository.findAll();
        Map<Integer, Long> levelMap = allUsers.stream()
                .collect(Collectors.groupingBy(u -> u.getLevel() != null ? u.getLevel() : 1, Collectors.counting()));

        List<LevelDistribution> levelDistributions = List.of(
                LevelDistribution.builder().levelName("Cấp 1 (Nhập môn)").userCount(levelMap.getOrDefault(1, 0L)).build(),
                LevelDistribution.builder().levelName("Cấp 2 (Cơ bản)").userCount(levelMap.getOrDefault(2, 0L)).build(),
                LevelDistribution.builder().levelName("Cấp 3 (Tự tin)").userCount(levelMap.getOrDefault(3, 0L)).build(),
                LevelDistribution.builder().levelName("Cấp 4 (Thành thạo)").userCount(levelMap.getOrDefault(4, 0L)).build(),
                LevelDistribution.builder().levelName("Cấp 5+ (Chuyên gia)").userCount(levelMap.getOrDefault(5, 0L)).build()
        );

        ChartData chartData = ChartData.builder()
                .dailyActivities(dailyActivities)
                .topicPractices(topicPractices)
                .levelDistribution(levelDistributions)
                .build();

        // 3. Hoạt động gần đây từ cơ sở dữ liệu thực
        class ActivityRecord {
            final LocalDateTime time;
            final RecentActivityItem item;
            ActivityRecord(LocalDateTime time, RecentActivityItem item) {
                this.time = time != null ? time : LocalDateTime.MIN;
                this.item = item;
            }
        }

        List<ActivityRecord> rawActivities = new ArrayList<>();

        for (PracticeAttempt p : practiceAttemptRepository.findTop20ByOrderByCreatedAtDesc()) {
            String signName = p.getSign() != null ? p.getSign().getNameVi() : "ký hiệu";
            boolean isOk = Boolean.TRUE.equals(p.getIsCorrect());
            String desc = (isOk ? "Luyện tập đạt ký hiệu \"" : "Luyện tập chưa đạt ký hiệu \"") + signName + "\"";
            if (p.getConfidence() != null) {
                int confPct = p.getConfidence().multiply(BigDecimal.valueOf(100)).intValue();
                desc += " (" + confPct + "% độ chuẩn)";
            }
            rawActivities.add(new ActivityRecord(p.getCreatedAt(), RecentActivityItem.builder()
                    .id("p_" + p.getPracticeId())
                    .type("PRACTICE")
                    .userName(p.getUser() != null ? p.getUser().getFullName() : "Học viên")
                    .userAvatar(p.getUser() != null ? p.getUser().getAvatarUrl() : null)
                    .description(desc)
                    .timeAgo(formatTimeAgo(p.getCreatedAt()))
                    .status(isOk ? "SUCCESS" : "WARNING")
                    .build()));
        }

        for (com.example.demo.entities.QuizAttempt q : quizAttemptRepository.findTop10ByOrderByStartedAtDesc()) {
            String topicName = q.getTopic() != null ? q.getTopic().getName() : "Tổng hợp";
            boolean passed = q.getScore() != null && q.getScore().compareTo(BigDecimal.valueOf(80)) >= 0;
            rawActivities.add(new ActivityRecord(q.getStartedAt(), RecentActivityItem.builder()
                    .id("q_" + q.getAttemptId())
                    .type("QUIZ")
                    .userName(q.getUser() != null ? q.getUser().getFullName() : "Học viên")
                    .userAvatar(q.getUser() != null ? q.getUser().getAvatarUrl() : null)
                    .description("Làm bài kiểm tra " + topicName + " (" + q.getScore() + "/100)")
                    .timeAgo(formatTimeAgo(q.getStartedAt()))
                    .status(passed ? "SUCCESS" : "WARNING")
                    .build()));
        }

        for (User u : userRepository.findTop5ByOrderByCreatedAtDesc()) {
            rawActivities.add(new ActivityRecord(u.getCreatedAt(), RecentActivityItem.builder()
                    .id("u_" + u.getUserId())
                    .type("REGISTER")
                    .userName(u.getFullName())
                    .userAvatar(u.getAvatarUrl())
                    .description("Đăng ký tài khoản mới (" + (u.getRole() != null ? u.getRole() : "STUDENT") + ")")
                    .timeAgo(formatTimeAgo(u.getCreatedAt()))
                    .status("INFO")
                    .build()));
        }

        List<RecentActivityItem> recentActivities = rawActivities.stream()
                .sorted((a, b) -> b.time.compareTo(a.time))
                .limit(10)
                .map(r -> r.item)
                .collect(Collectors.toList());

        // 4. Leaderboard: Top học viên XP
        List<User> topUsers = userRepository.findTop10ByOrderByXpDesc();
        List<LeaderboardItem> leaderboard = new ArrayList<>();
        long rank = 1;
        for (User u : topUsers) {
            leaderboard.add(LeaderboardItem.builder()
                    .rank(rank++)
                    .userId(u.getUserId())
                    .userName(u.getFullName())
                    .userAvatar(u.getAvatarUrl() != null ? u.getAvatarUrl() : "https://ui-avatars.com/api/?name=" + u.getFullName())
                    .level(u.getLevel())
                    .xp(u.getXp())
                    .streakDays(u.getStreakDays())
                    .build());
        }

        return AdminDashboardResponse.builder()
                .kpis(kpiStats)
                .charts(chartData)
                .recentActivities(recentActivities)
                .leaderboard(leaderboard)
                .build();
    }

    private String formatTimeAgo(LocalDateTime time) {
        if (time == null) return "";
        java.time.Duration d = java.time.Duration.between(time, LocalDateTime.now());
        long minutes = d.toMinutes();
        if (minutes < 1) return "Vừa xong";
        if (minutes < 60) return minutes + " phút trước";
        long hours = d.toHours();
        if (hours < 24) return hours + " giờ trước";
        long days = d.toDays();
        return days + " ngày trước";
    }
}
