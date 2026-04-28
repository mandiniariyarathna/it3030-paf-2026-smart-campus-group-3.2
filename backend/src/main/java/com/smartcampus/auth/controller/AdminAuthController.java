package com.smartcampus.auth.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.auth.dto.AdminAuthRequest;
import com.smartcampus.auth.dto.AdminAuthResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AdminAuthController {

    @Value("${admin.username}")
    private String configuredAdminUsername;

    @Value("${admin.password}")
    private String configuredAdminPassword;

    @Value("${admin.display-name}")
    private String configuredAdminDisplayName;

    @Value("${admin.email}")
    private String configuredAdminEmail;

    @PostMapping("/admin")
    public ResponseEntity<AdminAuthResponse> adminLogin(@Valid @RequestBody AdminAuthRequest request) {
        if (configuredAdminUsername == null || configuredAdminPassword == null) {
            return ResponseEntity.status(500).body(new AdminAuthResponse("Admin login not configured on server.", "", ""));
        }

        if (configuredAdminUsername.equals(request.username()) && configuredAdminPassword.equals(request.password())) {
            return ResponseEntity.ok(new AdminAuthResponse("Admin authenticated", configuredAdminDisplayName, configuredAdminEmail));
        }

        return ResponseEntity.status(401).body(new AdminAuthResponse("Invalid admin credentials", "", ""));
    }
}
