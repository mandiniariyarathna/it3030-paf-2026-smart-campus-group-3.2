package com.smartcampus.auth.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
@CompoundIndex(def = "{'recipientId': 1, 'isRead': 1}")
public class Notification {

    @Id
    private String id;

    @NotNull
    private String recipientId;

    private NotificationType type;

    @NotBlank
    @Size(max = 100)
    private String title;

    @NotBlank
    @Size(max = 500)
    private String message;

    @Builder.Default
    private boolean isRead = false;

    private String referenceId;

    private String referenceType;

    @CreatedDate
    private LocalDateTime createdAt;
}
