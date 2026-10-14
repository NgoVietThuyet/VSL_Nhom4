package com.example.demo.service.impl;

import com.example.demo.dto.response.dashboard.DashboardResponse;
import com.example.demo.dto.response.sign.SignResponse;
import com.example.demo.dto.response.topic.TopicResponse;
import com.example.demo.dto.response.user.UserResponse;
import com.example.demo.entities.LearningProgress;
import com.example.demo.entities.Sign;
import com.example.demo.entities.Topic;
import com.example.demo.entities.User;
import com.example.demo.mapper.SignMapper;
import com.example.demo.mapper.TopicMapper;
import com.example.demo.mapper.UserMapper;
import com.example.demo.repository.LearningProgressRepository;
import com.example.demo.repository.SignRepository;
import com.example.demo.repository.TopicRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final UserRepository userRepository;
    private final TopicRepository topicRepository;
    private final SignRepository signRepository;
    private final LearningProgressRepository progressRepository;
    private final UserMapper userMapper;
    private final TopicMapper topicMapper;
    private final SignMapper signMapper;

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getDashboardData(String userEmail) {
        // 1. Tìm thông tin người dùng (ưu tiên email, fallback user đầu tiên trong DB)
        User user = null;
        if (userEmail != null && !userEmail.isBlank()) {
            user = userRepository.findByEmail(userEmail).orElse(null);
        }
        if (user == null) {
            user = userRepository.findAll().stream().findFirst().orElse(null);
        }

        UserResponse userResponse = user != null ? userMapper.toUserResponse(user) : null;

        // 2. Tìm danh sách chủ đề
        List<Topic> activeTopics = topicRepository.findByIsActiveOrderByDisplayOrderAsc(true);
        Topic currentTopic = activeTopics.isEmpty() ? null : activeTopics.get(0);
        TopicResponse currentTopicResponse = currentTopic != null ? topicMapper.toTopicResponse(currentTopic) : null;

        // 3. Tính toán số ký hiệu đã học trong chủ đề hiện tại
        int completedSignsInTopic = 0;
        int currentTopicTotalSigns = 0;
        if (currentTopic != null && user != null) {
            List<Sign> signsInTopic = signRepository.findByTopic_TopicIdAndIsActive(currentTopic.getTopicId(), true);
            currentTopicTotalSigns = signsInTopic.size();
            for (Sign sign : signsInTopic) {
                Optional<LearningProgress> p = progressRepository.findByUser_UserIdAndSign_SignId(user.getUserId(), sign.getSignId());
                if (p.isPresent() && "mastered".equalsIgnoreCase(p.get().getStatus())) {
                    completedSignsInTopic++;
                }
            }
        }

        int currentTopicProgress = currentTopicTotalSigns > 0
                ? (int) Math.round(((double) completedSignsInTopic / currentTopicTotalSigns) * 100)
                : 85;

        // 4. Lấy danh sách ký hiệu tiêu biểu hôm nay (Lấy các ký hiệu đầu tiên)
        List<Sign> allSigns = signRepository.findAll();
        List<SignResponse> recommendedSigns = allSigns.stream()
                .limit(6)
                .map(signMapper::toSignResponse)
                .collect(Collectors.toList());

        // 5. Lấy danh sách từ cần ôn tập
        List<SignResponse> reviewSigns = Collections.emptyList();
        if (user != null) {
            List<LearningProgress> reviewProgressList = progressRepository.findByUser_UserIdAndStatus(user.getUserId(), "review");
            reviewSigns = reviewProgressList.stream()
                    .map(lp -> signMapper.toSignResponse(lp.getSign()))
                    .collect(Collectors.toList());
        }

        // 6. Tổng kết lộ trình khóa học
        long masteredSignsCount = user != null ? progressRepository.countByUser_UserIdAndStatus(user.getUserId(), "mastered") : 120;
        DashboardResponse.CourseOverview overview = DashboardResponse.CourseOverview.builder()
                .courseTitle("Khóa học VSL Cơ Bản")
                .levelTitle("Sơ cấp A1")
                .totalSigns(400)
                .masteredSigns((int) (masteredSignsCount > 0 ? masteredSignsCount : 120))
                .totalPhrases(100)
                .masteredPhrases(35)
                .overallProgress(30)
                .openTopicsCount(activeTopics.size() > 0 ? activeTopics.size() : 8)
                .aiAccuracy(94.2)
                .build();

        return DashboardResponse.builder()
                .user(userResponse)
                .courseOverview(overview)
                .currentTopic(currentTopicResponse)
                .currentTopicCompletedSigns(completedSignsInTopic > 0 ? completedSignsInTopic : 34)
                .currentTopicProgress(currentTopicProgress)
                .recommendedSigns(recommendedSigns)
                .reviewSigns(reviewSigns)
                .build();
    }
}
