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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/resources")
@Validated
@Tag(name = "Resources", description = "Facilities and assets catalogue management APIs")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @GetMapping
        @Operation(summary = "List resources", description = "Retrieve all resources with optional filtering")
        @ApiResponse(responseCode = "200", description = "Resources fetched successfully")
    public ResponseEntity<Map<String, Object>> getAllResources(
            @Parameter(description = "Filter by resource type")
            @RequestParam(required = false) ResourceType type,
            @Parameter(description = "Minimum required capacity")
            @RequestParam(required = false) Integer capacity,
            @Parameter(description = "Filter by location substring")
            @RequestParam(required = false) String location,
            @Parameter(description = "Filter by resource status")
            @RequestParam(required = false) ResourceStatus status) {

        List<ResourceDTO> resources = resourceService.getAllResources(type, capacity, location, status);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", resources);
        response.put("message", "Resources fetched successfully");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get resource by id", description = "Retrieve a specific resource by its identifier")
    @ApiResponse(responseCode = "200", description = "Resource fetched successfully")
    public ResponseEntity<ResourceResponseDTO> getResourceById(@PathVariable String id) {
        ResourceResponseDTO response = ResourceResponseDTO.builder()
                .success(true)
                .data(resourceService.getResourceById(id))
                .message("Resource fetched successfully")
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping
    @Operation(summary = "Create resource", description = "Create a new resource entry (ADMIN only)")
    @ApiResponse(responseCode = "200", description = "Resource created successfully")
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
    @Operation(summary = "Update resource", description = "Update an existing resource (ADMIN only)")
    @ApiResponse(responseCode = "200", description = "Resource updated successfully")
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
    @Operation(summary = "Delete resource", description = "Permanently delete a resource (ADMIN only)")
    @ApiResponse(responseCode = "204", description = "Resource deleted successfully")
    public ResponseEntity<Void> deleteResource(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {

        validateAdminRole(userRole);
        resourceService.deleteResource(id);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/availability")
    @Operation(summary = "Get availability windows", description = "Retrieve availability windows for a resource")
    @ApiResponse(responseCode = "200", description = "Availability windows fetched successfully")
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
