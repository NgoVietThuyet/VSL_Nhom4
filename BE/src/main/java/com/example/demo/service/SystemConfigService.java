package com.example.demo.service;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tham số cấu hình hệ thống dùng chung giữa trang Admin và logic chấm điểm.
 * Lưu trong bộ nhớ của tiến trình Backend (khởi động lại sẽ về giá trị mặc định).
 */
@Service
public class SystemConfigService {

    public static final String AI_CONFIDENCE_THRESHOLD = "aiConfidenceThreshold";
    public static final String FRAMES_PER_PREDICTION = "framesPerPrediction";
    public static final String XP_PER_MASTERY = "xpPerMastery";
    public static final String XP_PER_QUIZ_CORRECT = "xpPerQuizCorrect";

    /**
     * Khoá đang được logic Backend đọc thật sự. Hiện chưa có: logic chấm điểm phía học viên
     * (cộng XP khi luyện đúng) vẫn dùng mức cố định riêng, chưa đọc cấu hình này.
     */
    private static final Set<String> APPLIED_KEYS = Set.of();

    private static final Map<String, Number> DEFAULTS;

    static {
        Map<String, Number> d = new LinkedHashMap<>();
        d.put(AI_CONFIDENCE_THRESHOLD, 0.85);
        d.put(FRAMES_PER_PREDICTION, 30);
        d.put(XP_PER_MASTERY, 100);
        d.put(XP_PER_QUIZ_CORRECT, 20);
        DEFAULTS = Collections.unmodifiableMap(d);
    }

    private final Map<String, Number> values = new ConcurrentHashMap<>(DEFAULTS);

    /** Giá trị hiện tại kèm danh sách khoá đang được áp dụng (để trang Admin hiển thị đúng). */
    public Map<String, Object> snapshot() {
        Map<String, Object> map = new LinkedHashMap<>();
        DEFAULTS.keySet().forEach(k -> map.put(k, values.get(k)));
        map.put("appliedKeys", new ArrayList<>(APPLIED_KEYS));
        return map;
    }

    /** Cập nhật các khoá đã biết; bỏ qua khoá lạ hoặc giá trị không phải số không âm. */
    public Map<String, Object> update(Map<String, Object> changes) {
        if (changes != null) {
            changes.forEach((key, raw) -> {
                if (!DEFAULTS.containsKey(key) || !(raw instanceof Number n)) return;
                double v = n.doubleValue();
                if (Double.isNaN(v) || v < 0) return;
                if (AI_CONFIDENCE_THRESHOLD.equals(key)) {
                    if (v > 1) return;
                    values.put(key, v);
                } else {
                    values.put(key, (int) Math.round(v));
                }
            });
        }
        return snapshot();
    }

    public int getInt(String key) {
        Number n = values.getOrDefault(key, DEFAULTS.get(key));
        return n != null ? n.intValue() : 0;
    }
}
