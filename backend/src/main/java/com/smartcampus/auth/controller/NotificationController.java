package com.smartcampus.auth.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.auth.dto.NotificationResponse;
import com.smartcampus.auth.security.AuthUserPrincipal;
import com.smartcampus.auth.service.NotificationService;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        AuthUserPrincipal principal = requirePrincipal(authentication);
        List<NotificationResponse> notifications = notificationService.getNotificationsForUser(principal.userId(), page, size);
        long unreadCount = notificationService.getUnreadCount(principal.userId());

        return ResponseEntity.ok(Map.of(
                "notifications", notifications,
                "unreadCount", unreadCount));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(Authentication authentication, @PathVariable String id) {
        AuthUserPrincipal principal = requirePrincipal(authentication);
        return ResponseEntity.ok(notificationService.markAsRead(principal.userId(), id));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(Authentication authentication) {
        AuthUserPrincipal principal = requirePrincipal(authentication);
        notificationService.markAllAsRead(principal.userId());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(Authentication authentication, @PathVariable String id) {
        AuthUserPrincipal principal = requirePrincipal(authentication);
        notificationService.deleteNotification(principal.userId(), id);
        return ResponseEntity.noContent().build();
    }

    private AuthUserPrincipal requirePrincipal(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthUserPrincipal principal)) {
            throw new IllegalArgumentException("User is not authenticated");
        }
        return principal;
    }
}
