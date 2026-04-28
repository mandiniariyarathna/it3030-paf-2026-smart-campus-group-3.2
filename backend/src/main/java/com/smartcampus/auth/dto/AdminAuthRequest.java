package com.smartcampus.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record AdminAuthRequest(
        @NotBlank
        String username,
        @NotBlank
        String password) {
}
