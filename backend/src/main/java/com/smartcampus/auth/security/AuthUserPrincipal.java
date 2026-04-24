package com.smartcampus.auth.security;

import com.smartcampus.auth.model.Role;

public record AuthUserPrincipal(
        String userId,
        String email,
        Role role) {
}
