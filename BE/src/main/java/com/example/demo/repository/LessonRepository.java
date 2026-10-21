package com.example.demo.repository;

import com.example.demo.entities.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByTopic_TopicIdOrderByDisplayOrderAscLessonIdAsc(Long topicId);

    List<Lesson> findByTopic_TopicIdAndIsActiveOrderByDisplayOrderAscLessonIdAsc(Long topicId, Boolean isActive);

    long countByTopic_TopicId(Long topicId);

    @Query("select coalesce(max(l.displayOrder), 0) from Lesson l where l.topic.topicId = :topicId")
    Integer findMaxDisplayOrder(@Param("topicId") Long topicId);

    // Mỗi phần tử: [topicId, số bài học]
    @Query("select l.topic.topicId, count(l) from Lesson l group by l.topic.topicId")
    List<Object[]> countByTopic();
}
