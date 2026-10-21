package com.example.demo.repository;

import com.example.demo.entities.PracticeAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PracticeAttemptRepository extends JpaRepository<PracticeAttempt, Long> {
    List<PracticeAttempt> findByUser_UserIdOrderByCreatedAtDesc(Long userId);
    List<PracticeAttempt> findByUser_UserIdAndSign_SignId(Long userId, Long signId);

    @Query("select avg(p.confidence) from PracticeAttempt p where p.user.userId = :userId and p.confidence is not null")
    BigDecimal averageConfidence(@Param("userId") Long userId);

    @Query("select avg(p.confidence) from PracticeAttempt p where p.confidence is not null")
    BigDecimal overallAverageConfidence();

    long countByCreatedAtAfter(java.time.LocalDateTime dateTime);

    java.util.List<PracticeAttempt> findTop20ByOrderByCreatedAtDesc();
    java.util.List<PracticeAttempt> findTop50ByOrderByCreatedAtDesc();
}
