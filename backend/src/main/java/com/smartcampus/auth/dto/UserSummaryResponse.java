package com.smartcampus.auth.dto;

import java.time.LocalDateTime;

public record UserSummaryResponse(
    String id,
    String fullName,
    String lastName,
    String username,
    String email,
    String mobileNumber,
    String role,
    String displayName,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
