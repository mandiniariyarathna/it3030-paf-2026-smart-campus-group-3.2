package com.smartcampus.auth.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.smartcampus.auth.model.Role;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(String userId, String email, Role role) {
        Instant now = Instant.now();

        return Jwts.builder()
                .subject(userId)
                .claim("email", email)
                .claim("role", role.name())
                .claims(Map.of(
                        "userId", userId,
                        "email", email,
                        "role", role.name()))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(signingKey)
                .compact();
    }

    public AuthUserPrincipal parseToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        String userId = claims.get("userId", String.class);
        String email = claims.get("email", String.class);
        String roleValue = claims.get("role", String.class);

        if (userId == null || email == null || roleValue == null) {
            throw new IllegalArgumentException("Token is missing required claims");
        }

        return new AuthUserPrincipal(userId, email, Role.valueOf(roleValue));
    }
}
