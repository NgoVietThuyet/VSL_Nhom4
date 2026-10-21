package com.example.demo.service;

import com.example.demo.dto.response.sign.SignResponse;
import com.example.demo.dto.response.topic.TopicResponse;

import java.util.List;

public interface TopicService {

    List<TopicResponse> getAllTopics(String level, String search, String userEmail);

    TopicResponse getTopicById(Long topicId);

    List<SignResponse> getSignsByTopic(Long topicId, String userEmail);
}
