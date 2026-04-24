package com.smartcampus.auth.service;

import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.smartcampus.auth.dto.GoogleAuthResponse;
import com.smartcampus.auth.model.Role;
import com.smartcampus.auth.model.User;
import com.smartcampus.auth.repository.UserRepository;
import com.smartcampus.auth.security.JwtService;

@Service
public class GoogleAuthService {

    private static final Set<String> ALLOWED_ISSUERS = Set.of("accounts.google.com", "https://accounts.google.com");

    private final RestTemplate restTemplate;
    private final String googleClientId;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public GoogleAuthService(
            @Value("${google.auth.client-id}") String googleClientId,
            UserRepository userRepository,
            JwtService jwtService) {
        this.restTemplate = new RestTemplate();
        this.googleClientId = googleClientId;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    public GoogleAuthResponse authenticateWithGoogle(String idToken) {
        GoogleTokenInfo tokenInfo = fetchTokenInfo(idToken);

        if (tokenInfo == null) {
            throw new IllegalArgumentException("Unable to verify Google token");
        }

        if (!googleClientId.equals(tokenInfo.aud())) {
            throw new IllegalArgumentException("Google client ID does not match token audience");
        }

        if (!ALLOWED_ISSUERS.contains(tokenInfo.iss())) {
            throw new IllegalArgumentException("Invalid token issuer");
        }

        if (!Boolean.TRUE.equals(tokenInfo.emailVerified())) {
            throw new IllegalArgumentException("Google email is not verified");
        }

        if (tokenInfo.email() == null || tokenInfo.email().isBlank()) {
            throw new IllegalArgumentException("Google account email is missing");
        }

        String displayName = tokenInfo.name() != null && !tokenInfo.name().isBlank()
                ? tokenInfo.name()
                : tokenInfo.email().split("@")[0];

        User user = upsertUser(tokenInfo, displayName);
        String accessToken = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());

        return new GoogleAuthResponse(
                "Google authentication successful",
                displayName,
                tokenInfo.email(),
                tokenInfo.picture(),
                user.getId(),
                user.getRole().name(),
                accessToken);
    }

    private User upsertUser(GoogleTokenInfo tokenInfo, String displayName) {
        String providerId = tokenInfo.sub();

        if (providerId == null || providerId.isBlank()) {
            throw new IllegalArgumentException("Google account ID is missing");
        }

        return userRepository.findByProviderId(providerId)
                .map(existingUser -> {
                    existingUser.setEmail(tokenInfo.email());
                    existingUser.setName(displayName);
                    existingUser.setPicture(tokenInfo.picture());
                    if (existingUser.getRole() == null) {
                        existingUser.setRole(Role.USER);
                    }
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> {
                    User user = new User();
                    user.setEmail(tokenInfo.email());
                    user.setName(displayName);
                    user.setPicture(tokenInfo.picture());
                    user.setProvider("google");
                    user.setProviderId(providerId);
                    user.setRole(Role.USER);
                    return userRepository.save(user);
                });
    }

    private GoogleTokenInfo fetchTokenInfo(String idToken) {
        String tokenInfoUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;

        try {
            ResponseEntity<GoogleTokenInfo> response = restTemplate.getForEntity(tokenInfoUrl, GoogleTokenInfo.class);
            return response.getBody();
        } catch (RestClientException exception) {
            throw new IllegalArgumentException("Invalid Google token");
        }
    }

        @JsonIgnoreProperties(ignoreUnknown = true)
        private record GoogleTokenInfo(
            String aud,
            String iss,
            String sub,
            String email,
            @JsonProperty("email_verified") Boolean emailVerified,
            String name,
            String picture) {
    }
}
