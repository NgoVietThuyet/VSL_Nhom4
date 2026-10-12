package com.example.demo.repository;

import com.example.demo.entities.PracticeAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PracticeAttemptRepository extends JpaRepository<PracticeAttempt, Long> {
    List<PracticeAttempt> findByUser_UserIdOrderByCreatedAtDesc(Long userId);
    List<PracticeAttempt> findByUser_UserIdAndSign_SignId(Long userId, Long signId);
}
