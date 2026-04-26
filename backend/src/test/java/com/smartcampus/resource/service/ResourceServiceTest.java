package com.smartcampus.resource.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartcampus.resource.dto.ResourceRequestDTO;
import com.smartcampus.resource.model.AvailabilityWindow;
import com.smartcampus.resource.model.Resource;
import com.smartcampus.resource.model.ResourceStatus;
import com.smartcampus.resource.model.ResourceType;
import com.smartcampus.resource.repository.ResourceRepository;

@ExtendWith(MockitoExtension.class)
class ResourceServiceTest {

    @Mock
    private ResourceRepository resourceRepository;

    private ResourceService resourceService;

    @BeforeEach
    void setUp() {
        resourceService = new ResourceService(resourceRepository);
    }

    @Test
    void shouldFilterResourcesByTypeCapacityAndStatus() {
        Resource hall = Resource.builder().id("1").name("Hall A").type(ResourceType.LECTURE_HALL).capacity(120)
                .location("A").status(ResourceStatus.ACTIVE).build();
        Resource lab = Resource.builder().id("2").name("Lab 1").type(ResourceType.LAB).capacity(30)
                .location("B").status(ResourceStatus.UNDER_MAINTENANCE).build();

        when(resourceRepository.findAll()).thenReturn(List.of(hall, lab));

        var results = resourceService.getAllResources(ResourceType.LECTURE_HALL, 100, "a", ResourceStatus.ACTIVE);

        assertEquals(1, results.size());
        assertEquals("1", results.getFirst().getId());
    }

    @Test
    void shouldCreateResourceWithDefaultStatusWhenMissing() {
        ResourceRequestDTO request = ResourceRequestDTO.builder()
                .name("Meeting Room")
                .type(ResourceType.MEETING_ROOM)
                .capacity(20)
                .location("Block D")
                .createdBy("admin")
                .build();

        when(resourceRepository.save(any(Resource.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var created = resourceService.createResource(request);

        assertEquals(ResourceStatus.ACTIVE, created.getStatus());
        verify(resourceRepository).save(any(Resource.class));
    }

    @Test
    void shouldUpdateExistingResource() {
        Resource existing = Resource.builder().id("res-1").name("Old").type(ResourceType.EQUIPMENT).capacity(1)
                .location("Old location").status(ResourceStatus.ACTIVE).build();

        ResourceRequestDTO request = ResourceRequestDTO.builder()
                .name("Projector")
                .type(ResourceType.EQUIPMENT)
                .capacity(2)
                .location("Media Room")
                .status(ResourceStatus.ACTIVE)
                .build();

        when(resourceRepository.findById("res-1")).thenReturn(Optional.of(existing));
        when(resourceRepository.save(any(Resource.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var updated = resourceService.updateResource("res-1", request);

        assertEquals("Projector", updated.getName());
        assertEquals(2, updated.getCapacity());
        assertEquals("Media Room", updated.getLocation());
    }

    @Test
    void shouldDeleteResource() {
        Resource existing = Resource.builder().id("res-2").name("Lab").type(ResourceType.LAB).capacity(40)
                .location("C").status(ResourceStatus.ACTIVE).build();

        when(resourceRepository.findById("res-2")).thenReturn(Optional.of(existing));

        resourceService.deleteResource("res-2");

        verify(resourceRepository).deleteById("res-2");
    }

    @Test
    void shouldReturnAvailabilityWindowsForResource() {
        AvailabilityWindow window = AvailabilityWindow.builder()
                .dayOfWeek(DayOfWeek.MONDAY)
                .startTime("08:00")
                .endTime("12:00")
                .build();

        Resource existing = Resource.builder().id("res-3").name("Hall").type(ResourceType.LECTURE_HALL).capacity(80)
                .location("Main").status(ResourceStatus.ACTIVE).availabilityWindows(List.of(window)).build();

        when(resourceRepository.findById("res-3")).thenReturn(Optional.of(existing));

        var windows = resourceService.getAvailabilityWindows("res-3");

        assertEquals(1, windows.size());
        assertEquals(DayOfWeek.MONDAY, windows.getFirst().getDayOfWeek());
    }

    @Test
    void shouldThrowWhenResourceNotFound() {
        when(resourceRepository.findById("missing")).thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> resourceService.getResourceById("missing"));

        assertTrue(exception.getMessage().contains("missing"));
    }
}
