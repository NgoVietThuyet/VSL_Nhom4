package com.example.demo.shared.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(500, "Lỗi hệ thống không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(400, "Khóa không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_REQUEST(400, "Yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST),
    RESOURCE_NOT_FOUND(404, "Không tìm thấy tài nguyên yêu cầu", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(401, "Chưa xác thực danh tính", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(403, "Không có quyền truy cập", HttpStatus.FORBIDDEN),
    USER_EXISTED(400, "Người dùng đã tồn tại trong hệ thống", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(404, "Người dùng không tồn tại", HttpStatus.NOT_FOUND),
    INVALID_CREDENTIALS(401, "Email hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED),
    FILE_UPLOAD_FAILED(500, "Tải tệp tin lên hệ thống thất bại", HttpStatus.INTERNAL_SERVER_ERROR),
    FILE_DELETE_FAILED(500, "Xóa tệp tin thất bại", HttpStatus.INTERNAL_SERVER_ERROR);

    private final int code;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(int code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}
