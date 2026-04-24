package com.smartcampus.auth.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.auth.dto.AuthMeResponse;
import com.smartcampus.auth.dto.UserResponse;
import com.smartcampus.auth.security.AuthUserPrincipal;
import com.smartcampus.auth.service.UserService;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<AuthMeResponse> getCurrentUser(Authentication authentication) {
        AuthUserPrincipal principal = requirePrincipal(authentication);
        UserResponse user = userService.getUserById(principal.userId());

        return ResponseEntity.ok(new AuthMeResponse(
                user.id(),
                user.email(),
                user.name(),
                user.picture(),
                user.role()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    private AuthUserPrincipal requirePrincipal(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthUserPrincipal principal)) {
            throw new IllegalArgumentException("User is not authenticated");
        }
        return principal;
    }
}
