package com.smartcampus.ticket.model;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketAttachment {

    private String attachmentId;
    private String fileName;
    private String storedFileName;
    private String contentType;
    private long fileSize;
    private LocalDateTime uploadedAt;
}
