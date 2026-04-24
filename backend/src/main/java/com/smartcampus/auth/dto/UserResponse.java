package com.smartcampus.auth.dto;

public record UserResponse(
        String id,
        String email,
        String name,
        String picture,
        String role) {
}
