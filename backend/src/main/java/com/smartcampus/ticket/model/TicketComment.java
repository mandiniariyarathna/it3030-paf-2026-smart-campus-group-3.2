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
public class TicketComment {

    private String commentId;
    private String authorId;
    private String content;

    @Builder.Default
    private boolean isEdited = false;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
