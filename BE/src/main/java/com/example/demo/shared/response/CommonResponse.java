package com.example.demo.shared.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CommonResponse<T> {

    private int status;
    private String message;
    private T data;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    public static <T> CommonResponse<T> success(T data) {
        return CommonResponse.<T>builder()
                .status(200)
                .message("Thành công")
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> CommonResponse<T> success(T data, String message) {
        return CommonResponse.<T>builder()
                .status(200)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> CommonResponse<T> error(int status, String message) {
        return CommonResponse.<T>builder()
                .status(status)
                .message(message)
                .data(null)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> CommonResponse<T> error(int status, String message, T errorDetails) {
        return CommonResponse.<T>builder()
                .status(status)
                .message(message)
                .data(errorDetails)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
