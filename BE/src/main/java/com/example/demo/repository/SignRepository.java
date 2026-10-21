package com.example.demo.repository;

import com.example.demo.entities.Sign;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SignRepository extends JpaRepository<Sign, Long> {
    List<Sign> findByTopic_TopicIdAndIsActive(Long topicId, Boolean isActive);
    Page<Sign> findByTopic_TopicId(Long topicId, Pageable pageable);
    List<Sign> findByNameViContainingIgnoreCaseAndIsActive(String nameVi, Boolean isActive);

    List<Sign> findTop6ByIsActiveOrderBySignIdAsc(Boolean isActive);

    long countByIsActive(Boolean isActive);

    long countByIsActiveAndContentType(Boolean isActive, String contentType);

    long countByTopic_TopicIdAndIsActive(Long topicId, Boolean isActive);

    // Mỗi phần tử: [topicId, số ký hiệu active]
    @Query("select s.topic.topicId, count(s) from Sign s where s.isActive = true group by s.topic.topicId")
    List<Object[]> countActiveByTopic();

    List<Sign> findByLesson_LessonIdOrderByDisplayOrderAscSignIdAsc(Long lessonId);

    List<Sign> findByLesson_LessonIdAndIsActiveOrderByDisplayOrderAscSignIdAsc(Long lessonId, Boolean isActive);

    List<Sign> findByTopic_TopicIdAndLessonIsNullOrderBySignIdAsc(Long topicId);

    List<Sign> findByTopic_TopicIdOrderBySignIdAsc(Long topicId);

    long countByLesson_LessonId(Long lessonId);

    long countByLesson_LessonIdAndIsActive(Long lessonId, Boolean isActive);

    @Query("select coalesce(max(s.displayOrder), 0) from Sign s where s.lesson.lessonId = :lessonId")
    Integer findMaxDisplayOrderInLesson(@org.springframework.data.repository.query.Param("lessonId") Long lessonId);
}
