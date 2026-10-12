package com.example.demo.repository;

import com.example.demo.entities.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByUser_UserIdOrderByStartedAtDesc(Long userId);
    List<QuizAttempt> findByUser_UserIdAndTopic_TopicId(Long userId, Long topicId);
}
