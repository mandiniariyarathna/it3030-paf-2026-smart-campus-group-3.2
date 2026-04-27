package com.smartcampus.ticket.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.ticket.dto.TicketAssignmentRequest;
import com.smartcampus.ticket.dto.TicketCommentCreateRequest;
import com.smartcampus.ticket.dto.TicketCommentUpdateRequest;
import com.smartcampus.ticket.dto.TicketCreateRequest;
import com.smartcampus.ticket.dto.TicketStatusUpdateRequest;
import com.smartcampus.ticket.model.Ticket;
import com.smartcampus.ticket.model.TicketCategory;
import com.smartcampus.ticket.model.TicketPriority;
import com.smartcampus.ticket.model.TicketStatus;
import com.smartcampus.ticket.repository.TicketRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TicketWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TicketRepository ticketRepository;

    @BeforeEach
    void setUp() {
        ticketRepository.deleteAll();
    }

    @Test
    void shouldCreateTicketWithMultipartPayload() throws Exception {
        TicketCreateRequest request = TicketCreateRequest.builder()
                .location("Main Hall")
                .category(TicketCategory.ELECTRICAL.name())
                .description("Main panel sparks")
                .priority(TicketPriority.CRITICAL)
                .contactDetails("admin@campus.com")
                .build();

        MockMultipartFile ticketPart = new MockMultipartFile(
                "ticket",
                "ticket.json",
                MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(request));

        MockMultipartFile imagePart = new MockMultipartFile(
                "attachments",
                "issue.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                "mock-image-content".getBytes());

        mockMvc.perform(multipart("/api/v1/tickets")
                        .file(ticketPart)
                        .file(imagePart)
                        .header("X-User-Id", "user-100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("OPEN"))
                .andExpect(jsonPath("$.data.attachments.length()").value(1));
    }

    @Test
    void shouldReturnOnlyOwnTicketsForUserRole() throws Exception {
        Ticket own = Ticket.builder()
                .reporterId("user-200")
                .location("Library")
                .category(TicketCategory.OTHER)
                .description("Air quality issue")
                .priority(TicketPriority.LOW)
                .status(TicketStatus.OPEN)
                .contactDetails("user-200@campus.com")
                .build();

        Ticket other = Ticket.builder()
                .reporterId("user-201")
                .location("Parking")
                .category(TicketCategory.STRUCTURAL)
                .description("Gate stuck")
                .priority(TicketPriority.MEDIUM)
                .status(TicketStatus.OPEN)
                .contactDetails("user-201@campus.com")
                .build();

        ticketRepository.saveAll(List.of(own, other));

        mockMvc.perform(get("/api/v1/tickets")
                        .header("X-User-Id", "user-200")
                        .header("X-User-Role", "USER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].reporterId").value("user-200"));
    }

    @Test
    void shouldAssignAndUpdateStatusAsAdminAndTechnician() throws Exception {
        Ticket saved = ticketRepository.save(Ticket.builder()
                .reporterId("user-300")
                .location("IT Lab")
                .category(TicketCategory.IT_EQUIPMENT)
                .description("PC will not boot")
                .priority(TicketPriority.HIGH)
                .status(TicketStatus.OPEN)
                .contactDetails("user-300@campus.com")
                .build());

        TicketAssignmentRequest assignmentRequest = TicketAssignmentRequest.builder()
                .technicianId("tech-77")
                .build();

        mockMvc.perform(put("/api/v1/tickets/{ticketId}/assign", saved.getId())
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignmentRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.assignedTechnicianId").value("tech-77"))
                .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"));

        TicketStatusUpdateRequest statusRequest = TicketStatusUpdateRequest.builder()
                .status(TicketStatus.RESOLVED)
                .resolutionNote("Replaced faulty RAM module")
                .build();

        mockMvc.perform(put("/api/v1/tickets/{ticketId}/status", saved.getId())
                        .header("X-User-Role", "TECHNICIAN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("RESOLVED"));
    }

    @Test
    void shouldAddEditAndDeleteCommentWorkflow() throws Exception {
        Ticket saved = ticketRepository.save(Ticket.builder()
                .reporterId("user-400")
                .location("Hall C")
                .category(TicketCategory.HVAC)
                .description("AC not cooling")
                .priority(TicketPriority.HIGH)
                .status(TicketStatus.OPEN)
                .contactDetails("user-400@campus.com")
                .build());

        TicketCommentCreateRequest addRequest = TicketCommentCreateRequest.builder()
                .content("Please prioritize this issue.")
                .build();

        String addResponse = mockMvc.perform(post("/api/v1/tickets/{ticketId}/comments", saved.getId())
                        .header("X-User-Id", "user-400")
                        .header("X-User-Role", "USER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.comments.length()").value(1))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String commentId = objectMapper.readTree(addResponse)
                .path("data")
                .path("comments")
                .get(0)
                .path("commentId")
                .asText();

        TicketCommentUpdateRequest editRequest = TicketCommentUpdateRequest.builder()
                .content("Please prioritize this issue, exam starts tomorrow.")
                .build();

        mockMvc.perform(put("/api/v1/tickets/{ticketId}/comments/{commentId}", saved.getId(), commentId)
                        .header("X-User-Id", "user-400")
                        .header("X-User-Role", "USER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(editRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.comments[0].isEdited").value(true));

        mockMvc.perform(delete("/api/v1/tickets/{ticketId}/comments/{commentId}", saved.getId(), commentId)
                        .header("X-User-Id", "user-400")
                        .header("X-User-Role", "USER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.comments.length()").value(0));
    }
}
