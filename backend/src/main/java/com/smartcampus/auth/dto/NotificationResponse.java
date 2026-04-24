package com.smartcampus.auth.dto;

import java.time.LocalDateTime;

public record NotificationResponse(
        String id,
        String type,
        String title,
        String message,
        boolean isRead,
        String referenceId,
        String referenceType,
        LocalDateTime createdAt) {
}
