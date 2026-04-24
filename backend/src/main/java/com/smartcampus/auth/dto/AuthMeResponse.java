package com.smartcampus.auth.dto;

public record AuthMeResponse(
        String userId,
        String email,
        String name,
        String picture,
        String role) {
}
