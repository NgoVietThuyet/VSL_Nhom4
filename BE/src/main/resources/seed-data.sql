-- =====================================================================
-- SCRIPT CHÈN DỮ LIỆU THỰC TẾ HỆ THỐNG VSL (SQL SERVER)
-- =====================================================================

-- 1. Chèn User mẫu (Mật khẩu: 123456 -> băm BCrypt)
IF NOT EXISTS (SELECT 1 FROM USERS WHERE email = 'minhanh.vsl@gmail.com')
BEGIN
    INSERT INTO USERS (full_name, email, password_hash, phone, avatar_url, role, xp, level, streak_days, status, created_at)
    VALUES (
        N'Nguyễn Minh Anh',
        'minhanh.vsl@gmail.com',
        '123456', -- mật khẩu plain text
        '0987654321',
        N'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        'STUDENT',
        1450,
        3,
        5,
        1,
        SYSDATETIME()
    );
END;

-- 2. Chèn 8 Chủ đề thực tế
IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE name LIKE N'%Chào hỏi%')
BEGIN
    INSERT INTO TOPICS (name, emoji, level, category, description, display_order, is_active, created_at) VALUES
    (N'Chào hỏi & Xã giao', N'👋', 'Cơ bản', 'single phrases', N'Các cử chỉ giao tiếp mở đầu thân thiện hàng ngày trong ngôn ngữ ký hiệu Việt Nam (VSL).', 1, 1, SYSDATETIME()),
    (N'Gia đình & Thân nhân', N'👨‍👩‍👧', 'Cơ bản', 'single', N'Xưng hô bố mẹ, anh chị em, ông bà và các mối quan hệ thân thuộc.', 2, 1, SYSDATETIME()),
    (N'Bảng chữ cái & Số đếm', N'🔤', 'Nhập môn', 'single', N'29 chữ cái tiếng Việt và số đếm từ 0 đến 100 bằng bàn tay.', 3, 1, SYSDATETIME()),
    (N'Cảm xúc & Biểu cảm', N'😊', 'Trung cấp', 'phrases', N'Thể hiện vui, buồn, ngạc nhiên, biết ơn kết hợp nét mặt tự nhiên.', 4, 1, SYSDATETIME()),
    (N'Trường học & Học tập', N'📚', 'Trung cấp', 'single', N'Thầy cô, bạn bè, môn học, bài kiểm tra và môi trường giảng đường.', 5, 1, SYSDATETIME()),
    (N'Ẩm thực & Món ăn Việt', N'🍲', 'Trung cấp', 'phrases', N'Món ăn ba miền, đặt món, hương vị và thói quen ăn uống.', 6, 1, SYSDATETIME()),
    (N'Y tế & Khẩn cấp', N'🏥', 'Nâng cao', 'phrases', N'Ký hiệu cấp cứu, bệnh viện, triệu chứng và yêu cầu giúp đỡ.', 7, 1, SYSDATETIME()),
    (N'Giao thông & Đi lại', N'🛵', 'Nâng cao', 'single', N'Chỉ đường, phương tiện giao thông xe máy, xe buýt, máy bay.', 8, 1, SYSDATETIME());
END;

-- 3. Chèn Ký hiệu mẫu của chủ đề Chào hỏi
DECLARE @topicId BIGINT;
SELECT TOP 1 @topicId = topic_id FROM TOPICS WHERE name LIKE N'%Chào hỏi%';

IF @topicId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM SIGNS WHERE topic_id = @topicId)
BEGIN
    INSERT INTO SIGNS (topic_id, content_type, name_vi, duration, video_url, video_thumb, description, steps_json, cultural_note, difficulty, is_active, created_at)
    VALUES
    (@topicId, 'single', N'Xin chào', '0:03',
     'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
     'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
     N'Cử chỉ mở lòng bàn tay hướng ngoại ngang tầm mắt.',
     N'[{"step":1,"title":"Tư thế bắt đầu","detail":"Đưa bàn tay phải lên ngang tầm mắt, hướng lòng bàn tay tự nhiên về phía trước, giữ khoảng cách khoảng 15-20cm so với gương mặt."},{"step":2,"title":"Cử động vẫy & Biểu cảm","detail":"Các ngón tay khép nhẹ, vẫy cổ tay từ trái qua phải 2 nhịp nhẹ nhàng, giữ vai thả lỏng và hướng mắt kèm nụ cười rạng rỡ."}]',
     N'Trong văn hóa VSL, khi chào người lớn tuổi, người thực hiện thường hơi cúi nhẹ đầu để thể hiện sự lễ phép và tôn kính.',
     1, 1, SYSDATETIME()),

    (@topicId, 'single', N'Cảm ơn', '0:04',
     'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
     'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
     N'Đầu ngón tay chạm cằm rồi đưa nhẹ về phía trước.',
     N'[{"step":1,"title":"Đặt tay ở cằm","detail":"Ngón tay khép, chạm nhẹ đầu ngón tay phải vào dưới cằm hoặc khóe môi."},{"step":2,"title":"Hướng ra ngoài","detail":"Nhẹ nhàng chuyển động bàn tay hướng về phía người đối diện với nét mặt cảm kích."}]',
     N'Cử chỉ xuất phát từ trái tim và lời nói, mang ý nghĩa gửi lòng biết ơn chân thành đến người nghe.',
     1, 1, SYSDATETIME()),

    (@topicId, 'single', N'Tạm biệt', '0:03',
     'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
     'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
     N'Bàn tay mở, gập các ngón tay 2 lần về phía lòng bàn tay.',
     N'[{"step":1,"title":"Giơ tay ngang ngực","detail":"Bàn tay phải mở ngang tầm ngực hoặc cằm, lòng bàn tay hướng về phía đối phương."},{"step":2,"title":"Gập ngón tay","detail":"Gập 4 ngón tay xuống lòng bàn tay 2 nhịp nhịp nhàng."}]',
     N'Dùng khi chia tay bạn bè hoặc đồng nghiệp.',
     1, 1, SYSDATETIME()),

    (@topicId, 'phrases', N'Rất vui được gặp bạn', '0:06',
     'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
     'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
     N'Hai bàn tay làm ký hiệu người chạm vào nhau kèm nụ cười.',
     N'[{"step":1,"title":"Ký hiệu Vui mừng","detail":"Bàn tay mở đặt trước ngực, vuốt nhẹ lên trên thể hiện sự hân hoan."},{"step":2,"title":"Ký hiệu Gặp gỡ","detail":"Hai ngón trỏ của hai bàn tay hướng vào nhau như hai người đang tiến lại gần."}]',
     N'Câu chào hỏi lịch sự và ấm áp khi lần đầu gặp gỡ.',
     2, 1, SYSDATETIME());
END;
