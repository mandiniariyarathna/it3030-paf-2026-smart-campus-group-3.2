package com.smartcampus.resource.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.DayOfWeek;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.resource.dto.ResourceRequestDTO;
import com.smartcampus.resource.model.AvailabilityWindow;
import com.smartcampus.resource.model.Resource;
import com.smartcampus.resource.model.ResourceStatus;
import com.smartcampus.resource.model.ResourceType;
import com.smartcampus.resource.repository.ResourceRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ResourceControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ResourceRepository resourceRepository;

    @BeforeEach
    void setup() {
        resourceRepository.deleteAll();
    }

    @Test
    void shouldCreateResourceWhenAdminHeaderPresent() throws Exception {
        ResourceRequestDTO request = ResourceRequestDTO.builder()
                .name("Lab B")
                .type(ResourceType.LAB)
                .capacity(40)
                .location("Block B")
                .description("Software engineering lab")
                .build();

        mockMvc.perform(post("/api/v1/resources")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Lab B"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    void shouldRejectCreateResourceWithoutAdminRole() throws Exception {
        ResourceRequestDTO request = ResourceRequestDTO.builder()
                .name("Room 12")
                .type(ResourceType.MEETING_ROOM)
                .capacity(12)
                .location("Block D")
                .build();

        mockMvc.perform(post("/api/v1/resources")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldFilterResourcesByStatus() throws Exception {
        Resource active = Resource.builder().name("Hall 1").type(ResourceType.LECTURE_HALL).capacity(100)
                .location("Main").status(ResourceStatus.ACTIVE).build();
        Resource outOfService = Resource.builder().name("Hall 2").type(ResourceType.LECTURE_HALL).capacity(90)
                .location("Main").status(ResourceStatus.OUT_OF_SERVICE).build();
        resourceRepository.saveAll(List.of(active, outOfService));

        mockMvc.perform(get("/api/v1/resources").param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].name").value("Hall 1"));
    }

    @Test
    void shouldReturnResourceAvailability() throws Exception {
        AvailabilityWindow window = AvailabilityWindow.builder()
                .dayOfWeek(DayOfWeek.FRIDAY)
                .startTime("09:00")
                .endTime("12:00")
                .build();

        Resource resource = Resource.builder()
                .name("Meeting Room A")
                .type(ResourceType.MEETING_ROOM)
                .capacity(15)
                .location("Admin Block")
                .status(ResourceStatus.ACTIVE)
                .availabilityWindows(List.of(window))
                .build();

        Resource saved = resourceRepository.save(resource);

        mockMvc.perform(get("/api/v1/resources/{id}/availability", saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].dayOfWeek").value("FRIDAY"));
    }

    @Test
    void shouldDeleteResource() throws Exception {
        Resource resource = Resource.builder()
                .name("Projector")
                .type(ResourceType.EQUIPMENT)
                .capacity(1)
                .location("Media Center")
                .status(ResourceStatus.ACTIVE)
                .build();

        Resource saved = resourceRepository.save(resource);

        mockMvc.perform(delete("/api/v1/resources/{id}", saved.getId())
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isNoContent());
    }

    @Test
    void shouldUpdateResourceWhenAdminHeaderPresent() throws Exception {
        Resource resource = Resource.builder()
                .name("Old Name")
                .type(ResourceType.LAB)
                .capacity(30)
                .location("Block A")
                .status(ResourceStatus.ACTIVE)
                .build();

        Resource saved = resourceRepository.save(resource);

        ResourceRequestDTO updateRequest = ResourceRequestDTO.builder()
                .name("Updated Lab")
                .type(ResourceType.LAB)
                .capacity(35)
                .location("Block A")
                .status(ResourceStatus.UNDER_MAINTENANCE)
                .build();

        mockMvc.perform(put("/api/v1/resources/{id}", saved.getId())
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Updated Lab"))
                .andExpect(jsonPath("$.data.status").value("UNDER_MAINTENANCE"));
    }
}
