package com.smartcampus.auth.dto;

public record UserLoginResponse(
    String id,
    String displayName,
    String email,
    String username,
    String role,
    String message
) {
}
