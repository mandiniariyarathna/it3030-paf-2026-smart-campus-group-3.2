package com.smartcampus.auth.dto;

public record UserSignupResponse(
    String id,
    String fullName,
    String lastName,
    String username,
    String email,
    String mobileNumber,
    String role,
    String displayName,
    String message
) {
}
