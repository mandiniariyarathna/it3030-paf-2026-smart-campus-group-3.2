package com.smartcampus.auth.service;

import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.smartcampus.auth.dto.GoogleAuthResponse;

@Service
public class GoogleAuthService {

    private static final Set<String> ALLOWED_ISSUERS = Set.of("accounts.google.com", "https://accounts.google.com");

    private final RestTemplate restTemplate;
    private final String googleClientId;

    public GoogleAuthService(@Value("${google.auth.client-id}") String googleClientId) {
        this.restTemplate = new RestTemplate();
        this.googleClientId = googleClientId;
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

        if (!"true".equalsIgnoreCase(tokenInfo.emailVerified())) {
            throw new IllegalArgumentException("Google email is not verified");
        }

        if (tokenInfo.email() == null || tokenInfo.email().isBlank()) {
            throw new IllegalArgumentException("Google account email is missing");
        }

        String displayName = tokenInfo.name() != null && !tokenInfo.name().isBlank()
                ? tokenInfo.name()
                : tokenInfo.email().split("@")[0];

        return new GoogleAuthResponse(
                "Google authentication successful",
                displayName,
                tokenInfo.email(),
                tokenInfo.picture());
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

    private record GoogleTokenInfo(
            String aud,
            String iss,
            String email,
            String emailVerified,
            String name,
            String picture) {
    }
}
