package com.smartcampus.auth.service;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.smartcampus.auth.dto.NotificationResponse;
import com.smartcampus.auth.model.Notification;
import com.smartcampus.auth.model.NotificationType;
import com.smartcampus.auth.repository.NotificationRepository;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public NotificationResponse createNotification(
            String recipientId,
            NotificationType type,
            String title,
            String message,
            String referenceId,
            String referenceType) {
        Notification notification = new Notification();
        notification.setRecipientId(recipientId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setReferenceId(referenceId);
        notification.setReferenceType(referenceType);

        notification = notificationRepository.save(notification);

        return toResponse(notification);
    }

    public List<NotificationResponse> getNotificationsForUser(String recipientId, int page, int size) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId, PageRequest.of(page, size)).stream()
                .map(this::toResponse)
                .toList();
    }

    public long getUnreadCount(String recipientId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(recipientId);
    }

    public NotificationResponse markAsRead(String recipientId, String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        if (!recipientId.equals(notification.getRecipientId())) {
            throw new IllegalArgumentException("You are not allowed to update this notification");
        }

        notification.setRead(true);
        return toResponse(notificationRepository.save(notification));
    }

    public void markAllAsRead(String recipientId) {
        List<Notification> notifications = notificationRepository.findByRecipientIdAndIsRead(recipientId, false);
        notifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    public void deleteNotification(String recipientId, String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        if (!recipientId.equals(notification.getRecipientId())) {
            throw new IllegalArgumentException("You are not allowed to delete this notification");
        }

        notificationRepository.deleteById(notificationId);
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType() != null ? notification.getType().name() : null,
                notification.getTitle(),
                notification.getMessage(),
                notification.isRead(),
                notification.getReferenceId(),
                notification.getReferenceType(),
                notification.getCreatedAt());
    }
}
