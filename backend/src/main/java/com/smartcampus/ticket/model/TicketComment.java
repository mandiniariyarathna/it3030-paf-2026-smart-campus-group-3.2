package com.smartcampus.ticket.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

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

    @JsonProperty("isEdited")
    @Builder.Default
    private boolean isEdited = false;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
