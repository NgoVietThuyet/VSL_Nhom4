package com.example.demo.repository;

import com.example.demo.entities.LearningProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LearningProgressRepository extends JpaRepository<LearningProgress, Long> {
    Optional<LearningProgress> findByUser_UserIdAndSign_SignId(Long userId, Long signId);
    List<LearningProgress> findByUser_UserIdAndStatus(Long userId, String status);
    long countByUser_UserIdAndStatus(Long userId, String status);
}
