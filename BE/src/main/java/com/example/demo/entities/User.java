package com.example.demo.entities;

import com.example.demo.entities.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "USERS")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Builder.Default
    @Column(name = "role", nullable = false, length = 20)
    private String role = "STUDENT";

    @Builder.Default
    @Column(name = "xp", nullable = false)
    private Integer xp = 0;

    @Builder.Default
    @Column(name = "level", nullable = false)
    private Integer level = 1;

    @Builder.Default
    @Column(name = "streak_days", nullable = false)
    private Integer streakDays = 0;

    @Builder.Default
    @Column(name = "status", nullable = false)
    private Boolean status = true;
}
