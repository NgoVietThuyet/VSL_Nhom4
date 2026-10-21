package com.example.demo.service.impl;

import com.example.demo.dto.response.dashboard.DashboardResponse;
import com.example.demo.dto.response.sign.SignResponse;
import com.example.demo.entities.Topic;
import com.example.demo.entities.User;
import com.example.demo.mapper.SignMapper;
import com.example.demo.mapper.TopicMapper;
import com.example.demo.mapper.UserMapper;
import com.example.demo.repository.LearningProgressRepository;
import com.example.demo.repository.PracticeAttemptRepository;
import com.example.demo.repository.SignRepository;
import com.example.demo.repository.TopicRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.DashboardService;
import com.example.demo.shared.exception.AppException;
import com.example.demo.shared.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private static final String COURSE_TITLE = "Khóa học VSL Cơ Bản";
    private static final String STATUS_MASTERED = "mastered";
    private static final String STATUS_REVIEW = "review";
    private static final String CONTENT_PHRASES = "phrases";

    private final UserRepository userRepository;
    private final TopicRepository topicRepository;
    private final SignRepository signRepository;
    private final LearningProgressRepository progressRepository;
    private final PracticeAttemptRepository practiceRepository;
    private final UserMapper userMapper;
    private final TopicMapper topicMapper;
    private final SignMapper signMapper;

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getDashboardData(String userEmail) {
        User user = requireUser(userEmail);
        Long userId = user.getUserId();

        // 1. Chủ đề đang học: chủ đề của ký hiệu học gần nhất, chưa học gì thì lấy chủ đề đầu tiên
        List<Topic> activeTopics = topicRepository.findByIsActiveOrderByDisplayOrderAsc(true);
        Topic currentTopic = progressRepository
                .findFirstByUser_UserIdAndLastStudiedAtNotNullOrderByLastStudiedAtDesc(userId)
                .map(lp -> lp.getSign().getTopic())
                .orElse(activeTopics.isEmpty() ? null : activeTopics.get(0));

        // 2. Tiến độ trong chủ đề đang học
        int topicTotalSigns = 0;
        int topicMasteredSigns = 0;
        if (currentTopic != null) {
            topicTotalSigns = (int) signRepository.countByTopic_TopicIdAndIsActive(currentTopic.getTopicId(), true);
            topicMasteredSigns = (int) progressRepository
                    .countByUser_UserIdAndStatusAndSign_Topic_TopicId(userId, STATUS_MASTERED, currentTopic.getTopicId());
        }

        // 3. Ký hiệu tiêu biểu & ký hiệu cần ôn tập
        List<SignResponse> recommendedSigns = signRepository.findTop6ByIsActiveOrderBySignIdAsc(true).stream()
                .map(signMapper::toSignResponse)
                .collect(Collectors.toList());

        List<SignResponse> reviewSigns = progressRepository.findByUser_UserIdAndStatus(userId, STATUS_REVIEW).stream()
                .map(lp -> signMapper.toSignResponse(lp.getSign()))
                .collect(Collectors.toList());

        // 4. Tổng kết lộ trình khóa học
        int totalSigns = (int) signRepository.countByIsActive(true);
        int masteredSigns = (int) progressRepository.countByUser_UserIdAndStatus(userId, STATUS_MASTERED);
        int totalPhrases = (int) signRepository.countByIsActiveAndContentType(true, CONTENT_PHRASES);
        int masteredPhrases = (int) progressRepository
                .countByUser_UserIdAndStatusAndSign_ContentType(userId, STATUS_MASTERED, CONTENT_PHRASES);
        BigDecimal avgConfidence = practiceRepository.averageConfidence(userId);

        DashboardResponse.CourseOverview overview = DashboardResponse.CourseOverview.builder()
                .courseTitle(COURSE_TITLE)
                .levelTitle(levelTitle(user.getLevel()))
                .totalSigns(totalSigns)
                .masteredSigns(masteredSigns)
                .totalPhrases(totalPhrases)
                .masteredPhrases(masteredPhrases)
                .overallProgress(percent(masteredSigns, totalSigns))
                .openTopicsCount(activeTopics.size())
                .aiAccuracy(avgConfidence == null ? null
                        : avgConfidence.multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP).doubleValue())
                .build();

        return DashboardResponse.builder()
                .user(userMapper.toUserResponse(user))
                .courseOverview(overview)
                .currentTopic(currentTopic != null ? topicMapper.toTopicResponse(currentTopic) : null)
                .currentTopicCompletedSigns(topicMasteredSigns)
                .currentTopicProgress(percent(topicMasteredSigns, topicTotalSigns))
                .recommendedSigns(recommendedSigns)
                .reviewSigns(reviewSigns)
                .build();
    }

    private User requireUser(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
    }

    private static int percent(int part, int total) {
        return total > 0 ? (int) Math.round(part * 100.0 / total) : 0;
    }

    // Danh hiệu cấp độ theo USERS.level, dùng chung thang với cấp độ chủ đề
    private static String levelTitle(Integer level) {
        int lv = level != null ? level : 1;
        if (lv <= 1) return "Nhập môn";
        if (lv == 2) return "Cơ bản";
        if (lv == 3) return "Trung cấp";
        return "Nâng cao";
    }
}
