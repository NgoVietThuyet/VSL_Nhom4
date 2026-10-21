package com.example.demo.service.impl;

import com.example.demo.dto.response.sign.SignResponse;
import com.example.demo.dto.response.topic.TopicResponse;
import com.example.demo.entities.Sign;
import com.example.demo.entities.Topic;
import com.example.demo.entities.User;
import com.example.demo.mapper.SignMapper;
import com.example.demo.mapper.TopicMapper;
import com.example.demo.repository.LearningProgressRepository;
import com.example.demo.repository.SignRepository;
import com.example.demo.repository.TopicRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.TopicService;
import com.example.demo.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TopicServiceImpl implements TopicService {

    private final TopicRepository topicRepository;
    private final SignRepository signRepository;
    private final UserRepository userRepository;
    private final LearningProgressRepository progressRepository;
    private final TopicMapper topicMapper;
    private final SignMapper signMapper;

    @Override
    @Transactional(readOnly = true)
    public List<TopicResponse> getAllTopics(String level, String search, String userEmail) {
        String keyword = normalizeForSearch(blankToNull(search));
        List<Topic> topics = topicRepository.findActiveByLevel(blankToNull(level)).stream()
                .filter(t -> keyword == null || normalizeForSearch(t.getName()).contains(keyword))
                .toList();
        Map<Long, Long> signCounts = toCountMap(signRepository.countActiveByTopic());

        // Token không bắt buộc: có user thì kèm tiến độ cá nhân, không thì để null
        User user = userEmail != null ? userRepository.findByEmail(userEmail).orElse(null) : null;
        Map<Long, Long> masteredCounts = user != null
                ? toCountMap(progressRepository.countMasteredByTopic(user.getUserId()))
                : null;

        return topics.stream().map(topic -> {
            int signCount = signCounts.getOrDefault(topic.getTopicId(), 0L).intValue();
            TopicResponse response = topicMapper.toTopicResponse(topic, signCount);
            if (masteredCounts != null) {
                int mastered = masteredCounts.getOrDefault(topic.getTopicId(), 0L).intValue();
                response.setMasteredCount(mastered);
                response.setProgress(signCount > 0 ? (int) Math.round(mastered * 100.0 / signCount) : 0);
            }
            return response;
        }).collect(Collectors.toList());
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    // Tìm kiếm không phân biệt hoa thường và dấu tiếng Việt ("y te" khớp "Y tế").
    // Lọc ở Java vì LIKE trên SQL Server không khớp được các chữ có dấu kép (ế, ẩ...) với collation hiện tại.
    private static String normalizeForSearch(String text) {
        if (text == null) {
            return null;
        }
        String noAccents = Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return noAccents.replace('đ', 'd').replace('Đ', 'D').toLowerCase(Locale.ROOT);
    }

    private static Map<Long, Long> toCountMap(List<Object[]> rows) {
        return rows.stream().collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));
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

        return signs.stream()
                .map(signMapper::toSignResponse)
                .collect(Collectors.toList());
    }
}
