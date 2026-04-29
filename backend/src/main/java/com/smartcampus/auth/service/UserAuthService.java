package com.smartcampus.auth.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.smartcampus.auth.dto.UserLoginRequest;
import com.smartcampus.auth.dto.UserLoginResponse;
import com.smartcampus.auth.dto.UserSignupRequest;
import com.smartcampus.auth.dto.UserSignupResponse;
import com.smartcampus.auth.dto.UserSummaryResponse;
import com.smartcampus.auth.model.User;
import com.smartcampus.auth.repository.UserRepository;
import com.smartcampus.common.exception.ResourceNotFoundException;

@Service
public class UserAuthService {

    private final UserRepository userRepository;

    public UserAuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserSignupResponse signup(UserSignupRequest request) {
        // Check if user already exists by email
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already registered. Please use a different email or sign in.");
        }

        // Check if username already exists
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username already taken. Please choose a different username.");
        }

        // Create new user
        LocalDateTime now = LocalDateTime.now();
        String role = normalizeRole(request.role());
        String displayName = buildDisplayName(request.fullName(), request.lastName());
        String providerId = request.username();

        User user = User.builder()
            .fullName(request.fullName())
            .name(displayName)
            .lastName(request.lastName())
            .username(request.username())
            .email(request.email())
            .mobileNumber(request.mobileNumber())
            .password(request.password()) // In production, hash the password!
            .role(role)
            .provider("LOCAL")
            .providerId(providerId)
            .displayName(displayName)
            .createdAt(now)
            .updatedAt(now)
            .build();

        User savedUser = userRepository.save(user);

        return new UserSignupResponse(
            savedUser.getId(),
            savedUser.getFullName(),
            savedUser.getLastName(),
            savedUser.getUsername(),
            savedUser.getEmail(),
            savedUser.getMobileNumber(),
            savedUser.getRole().toLowerCase(),
            savedUser.getDisplayName(),
            "User registered successfully"
        );
    }

    public UserLoginResponse login(UserLoginRequest request) {
        // Find user by email or username
        User user = userRepository.findByEmailOrUsername(request.identifier(), request.identifier())
            .orElseThrow(() -> new ResourceNotFoundException("User not found with identifier: " + request.identifier()));

        // Verify password (in production, use proper password hashing!)
        if (!user.getPassword().equals(request.password())) {
            throw new IllegalArgumentException("Invalid password");
        }

        return new UserLoginResponse(
            user.getId(),
            user.getDisplayName(),
            user.getEmail(),
            user.getUsername(),
            user.getRole().toLowerCase(),
            "Login successful"
        );
    }

    public User getUserById(String userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    public List<UserSummaryResponse> getAllUsers() {
        return userRepository.findAll().stream()
            .map(this::toSummaryResponse)
            .collect(Collectors.toList());
    }

    private String buildDisplayName(String fullName, String lastName) {
        String combined = (fullName + " " + lastName).trim();
        return combined.isEmpty() ? "Campus User" : combined;
    }

    private String normalizeRole(String role) {
        if (role == null) {
            throw new IllegalArgumentException("Role is required");
        }

        String normalizedRole = role.trim().toUpperCase();
        if (!normalizedRole.equals("USER") && !normalizedRole.equals("TECHNICIAN")) {
            throw new IllegalArgumentException("Invalid role. Allowed roles are user and technician.");
        }

        return normalizedRole;
    }

    private UserSummaryResponse toSummaryResponse(User user) {
        return new UserSummaryResponse(
            user.getId(),
            user.getFullName(),
            user.getLastName(),
            user.getUsername(),
            user.getEmail(),
            user.getMobileNumber(),
            user.getRole().toLowerCase(),
            user.getDisplayName(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }
}
