package com.smartcampus.ticket.dto;

import com.smartcampus.ticket.model.TicketStatus;

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
public class TicketStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private TicketStatus status;

    @Size(max = 2000, message = "Resolution note cannot exceed 2000 characters")
    private String resolutionNote;

    @Size(max = 500, message = "Rejection reason cannot exceed 500 characters")
    private String rejectionReason;
}
