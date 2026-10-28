package com.example.demo.shared.auth;

import com.example.demo.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

/**
 * Xác thực đơn giản (không JWT): token chính là userId, gửi qua header "Authorization: Bearer {userId}".
 */
@Component
@RequiredArgsConstructor
public class TokenAuthenticationFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                Long userId = Long.parseLong(authHeader.substring(7).trim());
                userRepository.findById(userId)
                        .filter(user -> !Boolean.FALSE.equals(user.getStatus()))
                        .ifPresent(user -> {
                            List<SimpleGrantedAuthority> authorities = user.getRole() != null
                                    ? List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().toUpperCase()))
                                    : Collections.emptyList();
                            SecurityContextHolder.getContext().setAuthentication(
                                    new UsernamePasswordAuthenticationToken(user.getEmail(), null, authorities));
                        });
            } catch (NumberFormatException ignored) {
                // Token không hợp lệ -> coi như chưa đăng nhập
            }
        }

        filterChain.doFilter(request, response);
    }
}
