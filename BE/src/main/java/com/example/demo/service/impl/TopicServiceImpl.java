package com.example.demo.service.impl;

import com.example.demo.dto.response.sign.SignResponse;
import com.example.demo.dto.response.topic.TopicResponse;
import com.example.demo.entities.Sign;
import com.example.demo.entities.Topic;
import com.example.demo.mapper.SignMapper;
import com.example.demo.mapper.TopicMapper;
import com.example.demo.repository.SignRepository;
import com.example.demo.repository.TopicRepository;
import com.example.demo.service.TopicService;
import com.example.demo.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TopicServiceImpl implements TopicService {

    private final TopicRepository topicRepository;
    private final SignRepository signRepository;
    private final TopicMapper topicMapper;
    private final SignMapper signMapper;

    @Override
    @Transactional(readOnly = true)
    public List<TopicResponse> getAllTopics() {
        List<Topic> topics = topicRepository.findByIsActiveOrderByDisplayOrderAsc(true);
        if (topics.isEmpty()) {
            topics = topicRepository.findAll();
        }
        return topics.stream()
                .map(topicMapper::toTopicResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TopicResponse getTopicById(Long topicId) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chủ đề với ID: " + topicId));
        return topicMapper.toTopicResponse(topic);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SignResponse> getSignsByTopic(Long topicId, String userEmail) {
        // Kiểm tra chủ đề tồn tại
        if (!topicRepository.existsById(topicId)) {
            throw new ResourceNotFoundException("Không tìm thấy chủ đề với ID: " + topicId);
        }

        List<Sign> signs = signRepository.findByTopic_TopicIdAndIsActive(topicId, true);
        if (signs.isEmpty()) {
            signs = signRepository.findAll(); // Fallback nếu chủ đề chưa gán riêng ký hiệu
        }

        return signs.stream()
                .map(signMapper::toSignResponse)
                .collect(Collectors.toList());
    }
}
