package com.smartcampus.ticket.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
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
@Document(collection = "tickets")
public class Ticket {

    @Id
    private String id;

    @NotNull(message = "Reporter id is required")
    private String reporterId;

    private String resourceId;

    @NotBlank(message = "Location is required")
    @Size(max = 200, message = "Location cannot exceed 200 characters")
    private String location;

    @NotNull(message = "Category is required")
    private TicketCategory category;

    @NotBlank(message = "Description is required")
    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    @NotNull(message = "Priority is required")
    private TicketPriority priority;

    @Builder.Default
    private TicketStatus status = TicketStatus.OPEN;

    @NotBlank(message = "Contact details are required")
    @Size(max = 255, message = "Contact details cannot exceed 255 characters")
    private String contactDetails;

    private String assignedTechnicianId;
    private LocalDateTime assignedAt;

    @Size(max = 2000, message = "Resolution note cannot exceed 2000 characters")
    private String resolutionNote;

    @Size(max = 500, message = "Rejection reason cannot exceed 500 characters")
    private String rejectionReason;

    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;

    @Builder.Default
    private List<TicketAttachment> attachments = new ArrayList<>();

    @Builder.Default
    private List<TicketComment> comments = new ArrayList<>();

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
