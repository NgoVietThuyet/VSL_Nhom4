package com.example.demo.repository;

import com.example.demo.entities.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TopicRepository extends JpaRepository<Topic, Long> {
    List<Topic> findByIsActiveOrderByDisplayOrderAsc(Boolean isActive);
    List<Topic> findByCategoryAndIsActive(String category, Boolean isActive);

    @Query("select t from Topic t where t.isActive = true " +
            "and (:level is null or t.level = :level) " +
            "order by t.displayOrder asc")
    List<Topic> findActiveByLevel(@Param("level") String level);
    List<Topic> findAllByOrderByDisplayOrderAsc();
}
