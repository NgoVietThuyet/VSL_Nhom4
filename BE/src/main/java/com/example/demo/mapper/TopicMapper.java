package com.example.demo.mapper;

import com.example.demo.dto.request.topic.TopicRequest;
import com.example.demo.dto.response.topic.TopicResponse;
import com.example.demo.entities.Topic;
import org.springframework.stereotype.Component;

@Component
public class TopicMapper {

    public TopicResponse toTopicResponse(Topic topic) {
        if (topic == null) {
            return null;
        }

        int signCount = (topic.getSigns() != null) ? topic.getSigns().size() : 0;

        return TopicResponse.builder()
                .topicId(topic.getTopicId())
                .name(topic.getName())
                .emoji(topic.getEmoji())
                .level(topic.getLevel())
                .category(topic.getCategory())
                .description(topic.getDescription())
                .displayOrder(topic.getDisplayOrder())
                .isActive(topic.getIsActive())
                .signCount(signCount)
                .createdAt(topic.getCreatedAt())
                .build();
    }

    public Topic toEntity(TopicRequest request) {
        if (request == null) {
            return null;
        }

        return Topic.builder()
                .name(request.getName())
                .emoji(request.getEmoji())
                .level(request.getLevel())
                .category(request.getCategory())
                .description(request.getDescription())
                .displayOrder(request.getDisplayOrder())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
    }

    public void updateEntity(Topic topic, TopicRequest request) {
        if (topic == null || request == null) {
            return;
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            topic.setName(request.getName());
        }
        if (request.getEmoji() != null) {
            topic.setEmoji(request.getEmoji());
        }
        if (request.getLevel() != null) {
            topic.setLevel(request.getLevel());
        }
        if (request.getCategory() != null) {
            topic.setCategory(request.getCategory());
        }
        if (request.getDescription() != null) {
            topic.setDescription(request.getDescription());
        }
        if (request.getDisplayOrder() != null) {
            topic.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getIsActive() != null) {
            topic.setIsActive(request.getIsActive());
        }
    }
}
