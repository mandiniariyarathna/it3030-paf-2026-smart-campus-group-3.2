package com.smartcampus.auth.dto;

public record GoogleAuthResponse(
        String message,
        String displayName,
        String email,
        String avatarUrl) {
}
