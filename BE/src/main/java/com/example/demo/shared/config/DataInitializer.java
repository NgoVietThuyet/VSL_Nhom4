package com.example.demo.shared.config;

import com.example.demo.entities.LearningProgress;
import com.example.demo.entities.Lesson;
import com.example.demo.entities.Sign;
import com.example.demo.entities.Topic;
import com.example.demo.entities.User;
import com.example.demo.repository.LearningProgressRepository;
import com.example.demo.repository.LessonRepository;
import com.example.demo.repository.SignRepository;
import com.example.demo.repository.TopicRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TopicRepository topicRepository;
    private final SignRepository signRepository;
    private final LessonRepository lessonRepository;
    private final LearningProgressRepository progressRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        try {
            log.info("==> Đang kiểm tra và khởi tạo dữ liệu mẫu thực tế cho VSL DB...");

        // 1. Khởi tạo User mẫu thực tế
        User user = userRepository.findByEmail("minhanh.vsl@gmail.com").orElse(null);
        if (user == null) {
            user = User.builder()
                    .fullName("Nguyễn Minh Anh")
                    .email("minhanh.vsl@gmail.com")
                    .passwordHash(passwordEncoder.encode("123456"))
                    .phone("0987654321")
                    .avatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80")
                    .role("STUDENT")
                    .xp(1450)
                    .level(3)
                    .streakDays(5)
                    .status(true)
                    .build();
            user = userRepository.save(user);
            log.info("Đã tạo User mẫu: {} (Mật khẩu: 123456)", user.getEmail());
        }

        // 1.1 Khởi tạo Admin mặc định (admin / admin@123)
        User admin = userRepository.findByEmail("admin").orElse(null);
        if (admin == null) {
            admin = User.builder()
                    .fullName("Quản Trị Viên VSL")
                    .email("admin")
                    .passwordHash(passwordEncoder.encode("admin@123"))
                    .phone("0912345678")
                    .avatarUrl("https://ui-avatars.com/api/?name=Admin+VSL&background=0284c7&color=fff")
                    .role("ADMIN")
                    .xp(9999)
                    .level(10)
                    .streakDays(30)
                    .status(true)
                    .build();
            userRepository.save(admin);
            log.info("Đã tạo Admin mặc định: {} (Mật khẩu: admin@123)", admin.getEmail());
        } else {
            // Đảm bảo mật khẩu admin luôn là admin@123 và role là ADMIN
            admin.setPasswordHash(passwordEncoder.encode("admin@123"));
            admin.setRole("ADMIN");
            admin.setStatus(true);
            userRepository.save(admin);
            log.info("Đã cập nhật Admin mặc định: {} (Mật khẩu: admin@123)", admin.getEmail());
        }

        // 2. Khởi tạo 8 Chủ đề thực tế
        if (topicRepository.count() == 0) {
            Topic t1 = Topic.builder()
                    .name("Chào hỏi & Xã giao")
                    .emoji("👋")
                    .level("Cơ bản")
                    .category("single phrases")
                    .description("Các cử chỉ giao tiếp mở đầu thân thiện hàng ngày trong ngôn ngữ ký hiệu Việt Nam (VSL).")
                    .displayOrder(1)
                    .isActive(true)
                    .build();

            Topic t2 = Topic.builder()
                    .name("Gia đình & Thân nhân")
                    .emoji("👨‍👩‍👧")
                    .level("Cơ bản")
                    .category("single")
                    .description("Xưng hô bố mẹ, anh chị em, ông bà và các mối quan hệ thân thuộc.")
                    .displayOrder(2)
                    .isActive(true)
                    .build();

            Topic t3 = Topic.builder()
                    .name("Bảng chữ cái & Số đếm")
                    .emoji("🔤")
                    .level("Nhập môn")
                    .category("single")
                    .description("29 chữ cái tiếng Việt và số đếm từ 0 đến 100 bằng bàn tay.")
                    .displayOrder(3)
                    .isActive(true)
                    .build();

            Topic t4 = Topic.builder()
                    .name("Cảm xúc & Biểu cảm")
                    .emoji("😊")
                    .level("Trung cấp")
                    .category("phrases")
                    .description("Thể hiện vui, buồn, ngạc nhiên, biết ơn kết hợp nét mặt tự nhiên.")
                    .displayOrder(4)
                    .isActive(true)
                    .build();

            Topic t5 = Topic.builder()
                    .name("Trường học & Học tập")
                    .emoji("📚")
                    .level("Trung cấp")
                    .category("single")
                    .description("Thầy cô, bạn bè, môn học, bài kiểm tra và môi trường giảng đường.")
                    .displayOrder(5)
                    .isActive(true)
                    .build();

            Topic t6 = Topic.builder()
                    .name("Ẩm thực & Món ăn Việt")
                    .emoji("🍲")
                    .level("Trung cấp")
                    .category("phrases")
                    .description("Món ăn ba miền, đặt món, hương vị và thói quen ăn uống.")
                    .displayOrder(6)
                    .isActive(true)
                    .build();

            Topic t7 = Topic.builder()
                    .name("Y tế & Khẩn cấp")
                    .emoji("🏥")
                    .level("Nâng cao")
                    .category("phrases")
                    .description("Ký hiệu cấp cứu, bệnh viện, triệu chứng và yêu cầu giúp đỡ.")
                    .displayOrder(7)
                    .isActive(true)
                    .build();

            Topic t8 = Topic.builder()
                    .name("Giao thông & Đi lại")
                    .emoji("🛵")
                    .level("Nâng cao")
                    .category("single")
                    .description("Chỉ đường, phương tiện giao thông xe máy, xe buýt, máy bay.")
                    .displayOrder(8)
                    .isActive(true)
                    .build();

            topicRepository.saveAll(List.of(t1, t2, t3, t4, t5, t6, t7, t8));
            log.info("Đã khởi tạo thành công 8 chủ đề bài học thực tế.");
        }

        // 3. Khởi tạo Ký hiệu & Tiến độ học tập
        Topic chaoHoiTopic = topicRepository.findAll().stream()
                .filter(t -> t.getName().contains("Chào hỏi"))
                .findFirst()
                .orElse(null);

        if (chaoHoiTopic != null && signRepository.count() == 0) {
            Sign s1 = Sign.builder()
                    .topic(chaoHoiTopic)
                    .contentType("single")
                    .nameVi("Xin chào")
                    .duration("0:03")
                    .videoThumb("https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80")
                    .videoUrl("https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4")
                    .description("Cử chỉ mở lòng bàn tay hướng ngoại ngang tầm mắt.")
                    .stepsJson("[{\"step\":1,\"title\":\"Tư thế bắt đầu\",\"detail\":\"Đưa bàn tay phải lên ngang tầm mắt, hướng lòng bàn tay tự nhiên về phía trước, giữ khoảng cách khoảng 15-20cm so với gương mặt.\"},{\"step\":2,\"title\":\"Cử động vẫy & Biểu cảm\",\"detail\":\"Các ngón tay khép nhẹ, vẫy cổ tay từ trái qua phải 2 nhịp nhẹ nhàng, giữ vai thả lỏng và hướng mắt kèm nụ cười rạng rỡ.\"}]")
                    .culturalNote("Trong văn hóa VSL, khi chào người lớn tuổi, người thực hiện thường hơi cúi nhẹ đầu để thể hiện sự lễ phép và tôn kính.")
                    .difficulty(1)
                    .isActive(true)
                    .build();

            Sign s2 = Sign.builder()
                    .topic(chaoHoiTopic)
                    .contentType("single")
                    .nameVi("Cảm ơn")
                    .duration("0:04")
                    .videoThumb("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80")
                    .videoUrl("https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4")
                    .description("Đầu ngón tay chạm cằm rồi đưa nhẹ về phía trước.")
                    .stepsJson("[{\"step\":1,\"title\":\"Đặt tay ở cằm\",\"detail\":\"Ngón tay khép, chạm nhẹ đầu ngón tay phải vào dưới cằm hoặc khóe môi.\"},{\"step\":2,\"title\":\"Hướng ra ngoài\",\"detail\":\"Nhẹ nhàng chuyển động bàn tay hướng về phía người đối diện với nét mặt cảm kích.\"}]")
                    .culturalNote("Cử chỉ xuất phát từ trái tim và lời nói, mang ý nghĩa gửi lòng biết ơn chân thành đến người nghe.")
                    .difficulty(1)
                    .isActive(true)
                    .build();

            Sign s3 = Sign.builder()
                    .topic(chaoHoiTopic)
                    .contentType("single")
                    .nameVi("Tạm biệt")
                    .duration("0:03")
                    .videoThumb("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80")
                    .videoUrl("https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4")
                    .description("Bàn tay mở, gập các ngón tay 2 lần về phía lòng bàn tay.")
                    .stepsJson("[{\"step\":1,\"title\":\"Giơ tay ngang ngực\",\"detail\":\"Bàn tay phải mở ngang tầm ngực hoặc cằm, lòng bàn tay hướng về phía đối phương.\"},{\"step\":2,\"title\":\"Gập ngón tay\",\"detail\":\"Gập 4 ngón tay xuống lòng bàn tay 2 nhịp nhịp nhàng.\"}]")
                    .culturalNote("Dùng khi chia tay bạn bè hoặc đồng nghiệp.")
                    .difficulty(1)
                    .isActive(true)
                    .build();

            Sign s4 = Sign.builder()
                    .topic(chaoHoiTopic)
                    .contentType("phrases")
                    .nameVi("Rất vui được gặp bạn")
                    .duration("0:06")
                    .videoThumb("https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80")
                    .videoUrl("https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4")
                    .description("Hai bàn tay làm ký hiệu người chạm vào nhau kèm nụ cười.")
                    .stepsJson("[{\"step\":1,\"title\":\"Ký hiệu Vui mừng\",\"detail\":\"Bàn tay mở đặt trước ngực, vuốt nhẹ lên trên thể hiện sự hân hoan.\"},{\"step\":2,\"title\":\"Ký hiệu Gặp gỡ\",\"detail\":\"Hai ngón trỏ của hai bàn tay hướng vào nhau như hai người đang tiến lại gần.\"}]")
                    .culturalNote("Câu chào hỏi lịch sự và ấm áp khi lần đầu gặp gỡ.")
                    .difficulty(2)
                    .isActive(true)
                    .build();

            Sign s5 = Sign.builder()
                    .topic(chaoHoiTopic)
                    .contentType("single")
                    .nameVi("Xin lỗi")
                    .duration("0:03")
                    .videoThumb("https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80")
                    .videoUrl("https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4")
                    .description("Nắm tay đặt lên ngực xoa nhẹ theo hình tròn kèm nét mặt hối lỗi.")
                    .stepsJson("[{\"step\":1,\"title\":\"Nắm tay\",\"detail\":\"Nắm nhẹ bàn tay phải, đặt lên ngực trái.\"},{\"step\":2,\"title\":\"Xoa ngực\",\"detail\":\"Xoa nhẹ nhàng theo chiều kim đồng hồ 2 vòng.\"}]")
                    .culturalNote("Nét mặt thể hiện sự chân thành là yếu tố quyết định ngữ nghĩa.")
                    .difficulty(1)
                    .isActive(true)
                    .build();

            List<Sign> savedSigns = signRepository.saveAll(List.of(s1, s2, s3, s4, s5));
            log.info("Đã khởi tạo thành công 5 ký hiệu từ vựng mẫu.");

            // 4. Khởi tạo Tiến độ học tập cho User
            if (user != null) {
                LearningProgress lp1 = LearningProgress.builder()
                        .user(user)
                        .sign(savedSigns.get(0))
                        .status("mastered")
                        .masteryScore(BigDecimal.valueOf(95.0))
                        .lastStudiedAt(LocalDateTime.now().minusDays(1))
                        .build();

                LearningProgress lp2 = LearningProgress.builder()
                        .user(user)
                        .sign(savedSigns.get(1))
                        .status("mastered")
                        .masteryScore(BigDecimal.valueOf(92.0))
                        .lastStudiedAt(LocalDateTime.now().minusDays(1))
                        .build();

                LearningProgress lp3 = LearningProgress.builder()
                        .user(user)
                        .sign(savedSigns.get(2))
                        .status("review")
                        .masteryScore(BigDecimal.valueOf(78.0))
                        .lastStudiedAt(LocalDateTime.now().minusDays(2))
                        .build();

                LearningProgress lp4 = LearningProgress.builder()
                        .user(user)
                        .sign(savedSigns.get(3))
                        .status("unlearned")
                        .masteryScore(BigDecimal.ZERO)
                        .lastStudiedAt(null)
                        .build();

                progressRepository.saveAll(List.of(lp1, lp2, lp3, lp4));
                log.info("Đã khởi tạo tiến độ học tập thực tế cho user {}.", user.getEmail());
            }
        }

            seedLessons();

            log.info("==> Dữ liệu khởi tạo cho VSL DB hoàn tất!");
        } catch (Exception e) {
            log.error("Lưu ý: Không thể tự động khởi tạo dữ liệu vào SQL Server: {}", e.getMessage());
            log.info("Gợi ý: Bạn có thể chạy script thủ công tại: src/main/resources/seed-data.sql nếu cần.");
        }
    }

    /**
     * Lần đầu có bảng LESSONS: gom các ký hiệu chưa thuộc bài nào của mỗi chủ đề thành "Bài 1".
     */
    private void seedLessons() {
        if (lessonRepository.count() > 0) return;

        for (Topic topic : topicRepository.findAllByOrderByDisplayOrderAsc()) {
            List<Sign> unassigned = signRepository.findByTopic_TopicIdAndLessonIsNullOrderBySignIdAsc(topic.getTopicId());
            if (unassigned.isEmpty()) continue;

            Lesson lesson = lessonRepository.save(Lesson.builder()
                    .topic(topic)
                    .title("Bài 1: " + topic.getName() + " cơ bản")
                    .description("Những ký hiệu nền tảng của chủ đề " + topic.getName() + ".")
                    .difficulty(1)
                    .estimatedMinutes(10)
                    .displayOrder(1)
                    .isActive(true)
                    .build());

            int order = 1;
            for (Sign sign : unassigned) {
                sign.setLesson(lesson);
                sign.setDisplayOrder(order++);
            }
            signRepository.saveAll(unassigned);
            log.info("Đã tạo bài học mẫu '{}' với {} ký hiệu.", lesson.getTitle(), unassigned.size());
        }
    }
}
