package com.smartcampus.technician.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.smartcampus.technician.model.TechnicianStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianResponse {

    private String id;
    private String name;
    private String email;
    private String phone;
    private String specialization;
    private TechnicianStatus status;
    private List<String> assignedTicketIds;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
