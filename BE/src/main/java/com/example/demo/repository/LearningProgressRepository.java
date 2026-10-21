package com.example.demo.repository;

import com.example.demo.entities.LearningProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface LearningProgressRepository extends JpaRepository<LearningProgress, Long> {
    Optional<LearningProgress> findByUser_UserIdAndSign_SignId(Long userId, Long signId);
    List<LearningProgress> findByUser_UserIdAndStatus(Long userId, String status);
    long countByUser_UserIdAndStatus(Long userId, String status);

    long countByUser_UserIdAndStatusAndSign_ContentType(Long userId, String status, String contentType);

    long countByUser_UserIdAndStatusAndSign_Topic_TopicId(Long userId, String status, Long topicId);

    long countByUser_UserIdAndStatusAndSign_Lesson_LessonIdAndSign_IsActive(Long userId, String status, Long lessonId, Boolean isActive);

    List<LearningProgress> findByUser_UserIdAndSign_Lesson_LessonId(Long userId, Long lessonId);

    Optional<LearningProgress> findFirstByUser_UserIdAndLastStudiedAtNotNullOrderByLastStudiedAtDesc(Long userId);

    // Mỗi phần tử: [topicId, số ký hiệu đã thuần thục của user trong chủ đề]
    @Query("select lp.sign.topic.topicId, count(lp) from LearningProgress lp " +
            "where lp.user.userId = :userId and lp.status = 'mastered' and lp.sign.isActive = true " +
            "group by lp.sign.topic.topicId")
    List<Object[]> countMasteredByTopic(@Param("userId") Long userId);

    @Query("select avg(lp.masteryScore) from LearningProgress lp where lp.masteryScore > 0")
    BigDecimal averageMasteryScore();
}
