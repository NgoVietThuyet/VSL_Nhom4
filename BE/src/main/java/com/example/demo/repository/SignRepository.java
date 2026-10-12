package com.example.demo.repository;

import com.example.demo.entities.Sign;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SignRepository extends JpaRepository<Sign, Long> {
    List<Sign> findByTopic_TopicIdAndIsActive(Long topicId, Boolean isActive);
    Page<Sign> findByTopic_TopicId(Long topicId, Pageable pageable);
    List<Sign> findByNameViContainingIgnoreCaseAndIsActive(String nameVi, Boolean isActive);
}
