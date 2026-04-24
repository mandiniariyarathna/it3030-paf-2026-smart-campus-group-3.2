package com.smartcampus.resource.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.resource.dto.ResourceDTO;
import com.smartcampus.resource.dto.ResourceRequestDTO;
import com.smartcampus.resource.dto.ResourceResponseDTO;
import com.smartcampus.resource.model.AvailabilityWindow;
import com.smartcampus.resource.model.ResourceStatus;
import com.smartcampus.resource.model.ResourceType;
import com.smartcampus.resource.service.ResourceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/resources")
@Validated
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllResources(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) ResourceStatus status) {

        List<ResourceDTO> resources = resourceService.getAllResources(type, capacity, location, status);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", resources);
        response.put("message", "Resources fetched successfully");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponseDTO> getResourceById(@PathVariable String id) {
        ResourceResponseDTO response = ResourceResponseDTO.builder()
                .success(true)
                .data(resourceService.getResourceById(id))
                .message("Resource fetched successfully")
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ResourceResponseDTO> createResource(
            @Valid @RequestBody ResourceRequestDTO request,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {

        validateAdminRole(userRole);

        ResourceResponseDTO response = ResourceResponseDTO.builder()
                .success(true)
                .data(resourceService.createResource(request))
                .message("Resource created successfully")
                .build();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResourceResponseDTO> updateResource(
            @PathVariable String id,
            @Valid @RequestBody ResourceRequestDTO request,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {

        validateAdminRole(userRole);

        ResourceResponseDTO response = ResourceResponseDTO.builder()
                .success(true)
                .data(resourceService.updateResource(id, request))
                .message("Resource updated successfully")
                .build();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ResourceResponseDTO> softDeleteResource(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {

        validateAdminRole(userRole);

        ResourceResponseDTO response = ResourceResponseDTO.builder()
                .success(true)
                .data(resourceService.softDeleteResource(id))
                .message("Resource set to OUT_OF_SERVICE")
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<Map<String, Object>> getResourceAvailability(@PathVariable String id) {
        List<AvailabilityWindow> availabilityWindows = resourceService.getAvailabilityWindows(id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", availabilityWindows);
        response.put("message", "Availability windows fetched successfully");

        return ResponseEntity.ok(response);
    }

    private void validateAdminRole(String userRole) {
        if (userRole == null || !"ADMIN".equalsIgnoreCase(userRole)) {
            throw new IllegalArgumentException("Admin role is required for this operation");
        }
    }
}
