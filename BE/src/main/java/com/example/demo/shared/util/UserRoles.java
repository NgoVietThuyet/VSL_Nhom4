package com.example.demo.shared.util;

import com.example.demo.entities.User;

/** Một nơi duy nhất quyết định ai là học viên, ai là quản trị viên khi thống kê. */
public final class UserRoles {

    public static final String STUDENT = "STUDENT";
    public static final String ADMIN = "ADMIN";

    private UserRoles() {
    }

    public static boolean isAdmin(User user) {
        return user != null && user.getRole() != null && ADMIN.equalsIgnoreCase(user.getRole());
    }

    /** Tài khoản không phải quản trị viên đều được tính là học viên (khớp mặc định role = STUDENT). */
    public static boolean isStudent(User user) {
        return user != null && !isAdmin(user);
    }

    public static String label(String role) {
        return role != null && ADMIN.equalsIgnoreCase(role) ? "Quản trị viên" : "Học viên";
    }
}
