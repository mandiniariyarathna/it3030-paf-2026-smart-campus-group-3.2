package com.smartcampus.auth.dto;

import com.smartcampus.auth.model.Role;

import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(
        @NotNull(message = "Role is required")
        Role role) {
}
