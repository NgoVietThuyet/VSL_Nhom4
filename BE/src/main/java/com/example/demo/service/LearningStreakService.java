package com.example.demo.service;

import com.example.demo.repository.LearningProgressRepository;
import com.example.demo.repository.PracticeAttemptRepository;
import com.example.demo.repository.QuizAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Tính chuỗi ngày học liên tiếp từ dữ liệu học thật (lượt luyện AI, lượt làm Quiz,
 * lần học ký hiệu gần nhất) thay cho con số lưu cứng trong bảng users.
 *
 * Quy tắc: chuỗi = số ngày liên tiếp có ít nhất một hoạt động học, tính lùi từ hôm nay.
 * Nếu hôm nay chưa học nhưng hôm qua có học thì chuỗi vẫn được giữ (người học còn cả ngày hôm nay).
 */
@Service
@RequiredArgsConstructor
public class LearningStreakService {

    /** Chỉ xét hoạt động trong khoảng này để giới hạn dữ liệu đọc lên. */
    private static final int LOOKBACK_DAYS = 400;

    private final PracticeAttemptRepository practiceAttemptRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final LearningProgressRepository progressRepository;

    /** Chuỗi ngày học hiện tại của một người dùng. */
    @Transactional(readOnly = true)
    public int currentStreak(Long userId) {
        if (userId == null) return 0;
        LocalDateTime since = lookbackStart();
        Set<LocalDate> days = new HashSet<>();
        addDays(days, practiceAttemptRepository.findActivityTimesOfUserSince(userId, since));
        addDays(days, quizAttemptRepository.findActivityTimesOfUserSince(userId, since));
        addDays(days, progressRepository.findActivityTimesOfUserSince(userId, since));
        return streakFrom(days, LocalDate.now());
    }

    /** Ngày học của mọi người dùng có hoạt động gần đây: userId -> tập ngày có học. */
    @Transactional(readOnly = true)
    public Map<Long, Set<LocalDate>> activityDaysByUser() {
        LocalDateTime since = lookbackStart();
        Map<Long, Set<LocalDate>> result = new HashMap<>();
        collect(result, practiceAttemptRepository.findActivityTimesSince(since));
        collect(result, quizAttemptRepository.findActivityTimesSince(since));
        collect(result, progressRepository.findActivityTimesSince(since));
        return result;
    }

    /** Chuỗi ngày học hiện tại của mọi người dùng có hoạt động (người không có trong map = 0). */
    @Transactional(readOnly = true)
    public Map<Long, Integer> currentStreaks() {
        LocalDate today = LocalDate.now();
        Map<Long, Integer> streaks = new HashMap<>();
        activityDaysByUser().forEach((userId, days) -> streaks.put(userId, streakFrom(days, today)));
        return streaks;
    }

    /** Đếm số ngày liên tiếp có học, tính lùi từ hôm nay (hoặc hôm qua nếu hôm nay chưa học). */
    public static int streakFrom(Set<LocalDate> days, LocalDate today) {
        if (days == null || days.isEmpty()) return 0;
        LocalDate cursor;
        if (days.contains(today)) {
            cursor = today;
        } else if (days.contains(today.minusDays(1))) {
            cursor = today.minusDays(1);
        } else {
            return 0;
        }
        int streak = 0;
        while (days.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    private static LocalDateTime lookbackStart() {
        return LocalDate.now().minusDays(LOOKBACK_DAYS).atStartOfDay();
    }

    private static void addDays(Set<LocalDate> days, List<LocalDateTime> times) {
        for (LocalDateTime t : times) {
            if (t != null) days.add(t.toLocalDate());
        }
    }

    private static void collect(Map<Long, Set<LocalDate>> result, List<Object[]> rows) {
        for (Object[] row : rows) {
            if (row == null || row.length < 2 || row[0] == null || row[1] == null) continue;
            Long userId = ((Number) row[0]).longValue();
            LocalDateTime time = (LocalDateTime) row[1];
            result.computeIfAbsent(userId, k -> new HashSet<>()).add(time.toLocalDate());
        }
    }
}
