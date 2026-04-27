package com.smartcampus.ticket.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.smartcampus.ticket.model.TicketAttachment;
import com.smartcampus.ticket.model.TicketCategory;
import com.smartcampus.ticket.model.TicketComment;
import com.smartcampus.ticket.model.TicketPriority;
import com.smartcampus.ticket.model.TicketStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {

    private String id;
    private String reporterId;
    private String resourceId;
    private String location;
    private TicketCategory category;
    private String description;
    private TicketPriority priority;
    private TicketStatus status;
    private String contactDetails;
    private String assignedTechnicianId;
    private LocalDateTime assignedAt;
    private String resolutionNote;
    private String rejectionReason;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;

    @Builder.Default
    private List<TicketAttachment> attachments = new ArrayList<>();

    @Builder.Default
    private List<TicketComment> comments = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
