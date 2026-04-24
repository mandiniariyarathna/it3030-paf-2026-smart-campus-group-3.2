package com.smartcampus.resource.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceResponseDTO {

    private boolean success;
    private ResourceDTO data;
    private String message;
}
