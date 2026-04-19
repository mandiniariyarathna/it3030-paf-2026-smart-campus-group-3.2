package com.smartcampus.auth.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.auth.dto.GoogleAuthRequest;
import com.smartcampus.auth.dto.GoogleAuthResponse;
import com.smartcampus.auth.service.GoogleAuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@Validated
public class GoogleAuthController {

    private final GoogleAuthService googleAuthService;

    public GoogleAuthController(GoogleAuthService googleAuthService) {
        this.googleAuthService = googleAuthService;
    }

    @PostMapping("/google")
    public ResponseEntity<GoogleAuthResponse> googleAuth(@Valid @RequestBody GoogleAuthRequest request) {
        return ResponseEntity.ok(googleAuthService.authenticateWithGoogle(request.idToken()));
    }
}
