package com.example.demo.service.impl;

import com.example.demo.dto.request.practice.PracticeSubmitRequest;
import com.example.demo.dto.request.progress.ProgressUpdateRequest;
import com.example.demo.dto.response.practice.PracticeAttemptResponse;
import com.example.demo.dto.response.progress.LearningProgressResponse;
import com.example.demo.dto.response.sign.SignResponse;
import com.example.demo.entities.LearningProgress;
import com.example.demo.entities.PracticeAttempt;
import com.example.demo.entities.Sign;
import com.example.demo.entities.User;
import com.example.demo.mapper.LearningProgressMapper;
import com.example.demo.mapper.PracticeAttemptMapper;
import com.example.demo.mapper.SignMapper;
import com.example.demo.repository.LearningProgressRepository;
import com.example.demo.repository.PracticeAttemptRepository;
import com.example.demo.repository.SignRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.SignService;
import com.example.demo.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SignServiceImpl implements SignService {

    private final SignRepository signRepository;
    private final UserRepository userRepository;
    private final PracticeAttemptRepository practiceAttemptRepository;
    private final LearningProgressRepository progressRepository;
    private final SignMapper signMapper;
    private final PracticeAttemptMapper practiceAttemptMapper;
    private final LearningProgressMapper progressMapper;

    @Override
    @Transactional(readOnly = true)
    public List<SignResponse> getAllSigns(String search, Long topicId) {
        List<Sign> signs;

        if (topicId != null) {
            signs = signRepository.findByTopic_TopicIdAndIsActive(topicId, true);
        } else if (search != null && !search.isBlank()) {
            signs = signRepository.findByNameViContainingIgnoreCaseAndIsActive(search.trim(), true);
        } else {
            signs = signRepository.findAll();
        }

        return signs.stream()
                .map(signMapper::toSignResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SignResponse getSignById(Long signId) {
        Sign sign = signRepository.findById(signId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ký hiệu với ID: " + signId));
        return signMapper.toSignResponse(sign);
    }

    @Override
    @Transactional
    public PracticeAttemptResponse submitPractice(Long signId, PracticeSubmitRequest request, String userEmail) {
        User user = resolveUser(userEmail);
        Sign sign = signRepository.findById(signId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ký hiệu với ID: " + signId));

        // 1. Lưu lượt luyện tập AI
        PracticeAttempt attempt = PracticeAttempt.builder()
                .user(user)
                .sign(sign)
                .inputMode(request.getInputMode() != null ? request.getInputMode() : "camera")
                .predictedLabel(request.getPredictedLabel() != null ? request.getPredictedLabel() : sign.getNameVi())
                .confidence(request.getConfidence() != null ? request.getConfidence() : BigDecimal.valueOf(0.95))
                .isCorrect(Boolean.TRUE.equals(request.getIsCorrect()))
                .build();

        PracticeAttempt savedAttempt = practiceAttemptRepository.save(attempt);

        // 2. Cập nhật hoặc tạo mới tiến độ học tập (LearningProgress)
        LearningProgress progress = progressRepository.findByUser_UserIdAndSign_SignId(user.getUserId(), sign.getSignId())
                .orElse(LearningProgress.builder()
                        .user(user)
                        .sign(sign)
                        .build());

        if (Boolean.TRUE.equals(request.getIsCorrect())) {
            progress.setStatus("mastered");
            BigDecimal score = request.getConfidence() != null
                    ? request.getConfidence().multiply(BigDecimal.valueOf(100))
                    : BigDecimal.valueOf(95.0);
            progress.setMasteryScore(score);

            // Thưởng XP cho người dùng
            int currentXp = user.getXp() != null ? user.getXp() : 0;
            user.setXp(currentXp + 25);
            // Nâng cấp level nếu đủ XP
            if (user.getXp() >= user.getLevel() * 500) {
                user.setLevel(user.getLevel() + 1);
            }
            userRepository.save(user);
        } else {
            progress.setStatus("review");
        }

        progress.setLastStudiedAt(LocalDateTime.now());
        progressRepository.save(progress);

        log.info("Đã ghi nhận kết quả luyện tập AI: User={}, Sign={}, Correct={}",
                user.getEmail(), sign.getNameVi(), request.getIsCorrect());

        return practiceAttemptMapper.toPracticeAttemptResponse(savedAttempt);
    }

    @Override
    @Transactional
    public LearningProgressResponse updateProgress(Long signId, ProgressUpdateRequest request, String userEmail) {
        User user = resolveUser(userEmail);
        Sign sign = signRepository.findById(signId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ký hiệu với ID: " + signId));

        LearningProgress progress = progressRepository.findByUser_UserIdAndSign_SignId(user.getUserId(), sign.getSignId())
                .orElse(LearningProgress.builder()
                        .user(user)
                        .sign(sign)
                        .build());

        progress.setStatus(request.getStatus());
        if (request.getMasteryScore() != null) {
            progress.setMasteryScore(request.getMasteryScore());
        }
        progress.setLastStudiedAt(LocalDateTime.now());

        LearningProgress savedProgress = progressRepository.save(progress);
        return progressMapper.toLearningProgressResponse(savedProgress);
    }

    private User resolveUser(String userEmail) {
        if (userEmail != null && !userEmail.isBlank()) {
            User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user != null) return user;
        }
        return userRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Chưa có thông tin người dùng trong hệ thống"));
    }
}
