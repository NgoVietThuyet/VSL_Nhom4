package com.example.demo.repository;

import com.example.demo.entities.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByUser_UserIdOrderByStartedAtDesc(Long userId);
    List<QuizAttempt> findByUser_UserIdAndTopic_TopicId(Long userId, Long topicId);
    List<QuizAttempt> findTop50ByOrderByStartedAtDesc();
    List<QuizAttempt> findTop10ByOrderByStartedAtDesc();

    long countByStartedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
    long countByScoreGreaterThanEqual(java.math.BigDecimal minScore);

    @org.springframework.data.jpa.repository.Query("select avg(q.score) from QuizAttempt q")
    java.math.BigDecimal averageScore();

    // Mỗi phần tử: [userId, thời điểm làm bài] — dùng để tính chuỗi ngày học
    @org.springframework.data.jpa.repository.Query(
            "select q.user.userId, q.startedAt from QuizAttempt q where q.startedAt >= :since")
    List<Object[]> findActivityTimesSince(
            @org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);

    @org.springframework.data.jpa.repository.Query(
            "select q.startedAt from QuizAttempt q where q.user.userId = :userId and q.startedAt >= :since")
    List<java.time.LocalDateTime> findActivityTimesOfUserSince(
            @org.springframework.data.repository.query.Param("userId") Long userId,
            @org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);
}
