package com.smartcampus.auth.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.smartcampus.auth.model.Notification;

public interface NotificationRepository extends MongoRepository<Notification, String> {

    List<Notification> findByRecipientIdOrderByCreatedAtDesc(String recipientId);

    long countByRecipientIdAndIsReadFalse(String recipientId);

    List<Notification> findByRecipientIdAndIsRead(String recipientId, boolean isRead);

    List<Notification> findByRecipientIdOrderByCreatedAtDesc(String recipientId, Pageable pageable);
}
