package com.smartcampus.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record UserLoginRequest(
    @NotBlank(message = "Username or email is required")
    String identifier,

    @NotBlank(message = "Password is required")
    String password
) {
}
