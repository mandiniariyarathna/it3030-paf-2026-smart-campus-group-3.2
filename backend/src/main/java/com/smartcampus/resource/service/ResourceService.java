package com.smartcampus.resource.service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import com.smartcampus.resource.dto.ResourceDTO;
import com.smartcampus.resource.dto.ResourceRequestDTO;
import com.smartcampus.resource.model.AvailabilityWindow;
import com.smartcampus.resource.model.Resource;
import com.smartcampus.resource.model.ResourceStatus;
import com.smartcampus.resource.model.ResourceType;
import com.smartcampus.resource.repository.ResourceRepository;

@Service
public class ResourceService {

    private static final ObjectId DEFAULT_CREATED_BY = new ObjectId("660000000000000000000001");

    private final ResourceRepository resourceRepository;

    public ResourceService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    public List<ResourceDTO> getAllResources(ResourceType type, Integer capacity, String location, ResourceStatus status) {
        Stream<Resource> resourceStream = resourceRepository.findAll().stream();

        if (type != null) {
            resourceStream = resourceStream.filter(resource -> type.equals(resource.getType()));
        }

        if (capacity != null) {
            resourceStream = resourceStream.filter(resource -> resource.getCapacity() >= capacity);
        }

        if (location != null && !location.isBlank()) {
            String normalizedLocation = location.toLowerCase();
            resourceStream = resourceStream.filter(resource -> resource.getLocation() != null
                    && resource.getLocation().toLowerCase().contains(normalizedLocation));
        }

        if (status != null) {
            resourceStream = resourceStream.filter(resource -> status.equals(resource.getStatus()));
        }

        return resourceStream.map(this::toDto).toList();
    }

    public ResourceDTO getResourceById(String id) {
        return toDto(getResourceEntityById(id));
    }

    public ResourceDTO createResource(ResourceRequestDTO request) {
        Resource resource = Resource.builder()
                .name(request.getName())
                .type(request.getType())
                .capacity(request.getCapacity())
                .location(request.getLocation())
                .status(request.getStatus() == null ? ResourceStatus.ACTIVE : request.getStatus())
                .description(request.getDescription())
                .availabilityWindows(request.getAvailabilityWindows() == null
                        ? new ArrayList<>()
                        : request.getAvailabilityWindows())
            .createdBy(resolveCreatedBy(request.getCreatedBy()))
                .build();

        return toDto(resourceRepository.save(resource));
    }

    public ResourceDTO updateResource(String id, ResourceRequestDTO request) {
        Resource existingResource = getResourceEntityById(id);

        existingResource.setName(request.getName());
        existingResource.setType(request.getType());
        existingResource.setCapacity(request.getCapacity());
        existingResource.setLocation(request.getLocation());
        existingResource.setDescription(request.getDescription());
        existingResource.setCreatedBy(resolveCreatedBy(request.getCreatedBy()));
        existingResource.setStatus(request.getStatus() == null ? existingResource.getStatus() : request.getStatus());
        existingResource.setAvailabilityWindows(request.getAvailabilityWindows() == null
                ? new ArrayList<>()
                : request.getAvailabilityWindows());

        return toDto(resourceRepository.save(existingResource));
    }

    public ResourceDTO softDeleteResource(String id) {
        Resource resource = getResourceEntityById(id);
        resource.setStatus(ResourceStatus.OUT_OF_SERVICE);
        return toDto(resourceRepository.save(resource));
    }

    public List<AvailabilityWindow> getAvailabilityWindows(String id) {
        Resource resource = getResourceEntityById(id);
        return resource.getAvailabilityWindows() == null ? List.of() : resource.getAvailabilityWindows();
    }

    private Resource getResourceEntityById(String id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Resource not found with id: " + id));
    }

    private ResourceDTO toDto(Resource resource) {
        return ResourceDTO.builder()
                .id(resource.getId())
                .name(resource.getName())
                .type(resource.getType())
                .capacity(resource.getCapacity())
                .location(resource.getLocation())
                .status(resource.getStatus())
                .description(resource.getDescription())
                .availabilityWindows(resource.getAvailabilityWindows())
                .createdBy(resource.getCreatedBy() == null ? null : resource.getCreatedBy().toHexString())
                .createdAt(resource.getCreatedAt())
                .updatedAt(resource.getUpdatedAt())
                .build();
    }

    private ObjectId resolveCreatedBy(String createdBy) {
        if (createdBy == null || createdBy.isBlank()) {
            return DEFAULT_CREATED_BY;
        }

        try {
            return new ObjectId(createdBy);
        } catch (IllegalArgumentException exception) {
            return DEFAULT_CREATED_BY;
        }
    }
}
