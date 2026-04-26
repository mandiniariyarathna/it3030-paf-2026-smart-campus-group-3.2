package com.smartcampus.resource.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.smartcampus.resource.model.AvailabilityWindow;
import com.smartcampus.resource.model.ResourceStatus;
import com.smartcampus.resource.model.ResourceType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceDTO {

    private String id;
    private String name;
    private ResourceType type;
    private int capacity;
    private String location;
    private ResourceStatus status;
    private String description;
    private List<AvailabilityWindow> availabilityWindows;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
