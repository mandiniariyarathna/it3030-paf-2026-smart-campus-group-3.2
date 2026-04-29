package com.smartcampus.auth.dto;

public record AdminAuthResponse(
        String message,
        String displayName,
        String email) {
}
