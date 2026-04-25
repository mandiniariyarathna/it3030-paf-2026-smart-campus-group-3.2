package com.smartcampus.ticket.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.smartcampus.common.exception.ForbiddenOperationException;
import com.smartcampus.ticket.dto.TicketAssignmentRequest;
import com.smartcampus.ticket.dto.TicketCommentUpdateRequest;
import com.smartcampus.ticket.dto.TicketCreateRequest;
import com.smartcampus.ticket.dto.TicketStatusUpdateRequest;
import com.smartcampus.ticket.model.Ticket;
import com.smartcampus.ticket.model.TicketCategory;
import com.smartcampus.ticket.model.TicketComment;
import com.smartcampus.ticket.model.TicketPriority;
import com.smartcampus.ticket.model.TicketStatus;
import com.smartcampus.ticket.repository.TicketRepository;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private MongoTemplate mongoTemplate;

    private TicketService ticketService;

    @BeforeEach
    void setUp() {
        ticketService = new TicketService(ticketRepository, mongoTemplate);
    }

    @Test
    void shouldCreateTicketWithOpenStatus() {
        TicketCreateRequest request = TicketCreateRequest.builder()
                .location("Engineering Block")
                .category(TicketCategory.ELECTRICAL)
                .description("Ceiling light is flickering")
                .priority(TicketPriority.HIGH)
                .contactDetails("0771234567")
                .build();

        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> {
            Ticket ticket = invocation.getArgument(0);
            ticket.setId("ticket-1");
            return ticket;
        });

        var response = ticketService.createTicket("user-1", request, List.<MultipartFile>of());

        assertEquals("ticket-1", response.getId());
        assertEquals(TicketStatus.OPEN, response.getStatus());
        verify(ticketRepository).save(any(Ticket.class));
    }

    @Test
    void shouldListOnlyReporterTicketsForUserRole() {
        Ticket ownTicket = Ticket.builder()
                .id("ticket-2")
                .reporterId("user-2")
                .location("Lab 1")
                .category(TicketCategory.IT_EQUIPMENT)
                .description("Projector not working")
                .priority(TicketPriority.MEDIUM)
                .status(TicketStatus.OPEN)
                .contactDetails("user@email.com")
                .attachments(new ArrayList<>())
                .comments(new ArrayList<>())
                .build();

        when(ticketRepository.findByReporterId("user-2")).thenReturn(List.of(ownTicket));

        var tickets = ticketService.getTickets("user-2", "USER", null, null, null);

        assertEquals(1, tickets.size());
        assertEquals("ticket-2", tickets.getFirst().getId());
    }

    @Test
    void shouldRequireResolutionNoteWhenResolvingTicket() {
        Ticket ticket = Ticket.builder()
                .id("ticket-3")
                .reporterId("user-3")
                .status(TicketStatus.IN_PROGRESS)
                .attachments(new ArrayList<>())
                .comments(new ArrayList<>())
                .build();

        TicketStatusUpdateRequest request = TicketStatusUpdateRequest.builder()
                .status(TicketStatus.RESOLVED)
                .resolutionNote("   ")
                .build();

        when(ticketRepository.findById("ticket-3")).thenReturn(Optional.of(ticket));

        assertThrows(IllegalArgumentException.class,
                () -> ticketService.updateStatus("ticket-3", "TECHNICIAN", request));

        verify(ticketRepository, never()).save(any(Ticket.class));
    }

    @Test
    void shouldAssignTechnicianAndMoveOpenTicketToInProgress() {
        Ticket ticket = Ticket.builder()
                .id("ticket-4")
                .reporterId("user-4")
                .status(TicketStatus.OPEN)
                .attachments(new ArrayList<>())
                .comments(new ArrayList<>())
                .build();

        when(ticketRepository.findById("ticket-4")).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = ticketService.assignTechnician("ticket-4", "ADMIN",
                TicketAssignmentRequest.builder().technicianId("tech-1").build());

        assertEquals("tech-1", response.getAssignedTechnicianId());
        assertEquals(TicketStatus.IN_PROGRESS, response.getStatus());
    }

    @Test
    void shouldRejectCommentEditWhenUserIsNotOwner() {
        TicketComment comment = TicketComment.builder()
                .commentId("comment-1")
                .authorId("owner-1")
                .content("Original comment")
                .build();

        Ticket ticket = Ticket.builder()
                .id("ticket-5")
                .reporterId("user-5")
                .comments(List.of(comment))
                .attachments(new ArrayList<>())
                .build();

        when(ticketRepository.findById("ticket-5")).thenReturn(Optional.of(ticket));

        assertThrows(ForbiddenOperationException.class,
                () -> ticketService.editComment("ticket-5", "comment-1", "other-user", "USER",
                        TicketCommentUpdateRequest.builder().content("Updated").build()));

        verify(mongoTemplate, never()).updateFirst(any(), any(), any(Class.class));
    }

    @Test
    void shouldCloseTicketFromSoftDeleteEndpoint() {
        Ticket ticket = Ticket.builder()
                .id("ticket-6")
                .reporterId("user-6")
                .status(TicketStatus.IN_PROGRESS)
                .attachments(new ArrayList<>())
                .comments(new ArrayList<>())
                .build();

        when(ticketRepository.findById("ticket-6")).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = ticketService.softDeleteTicket("ticket-6", "ADMIN");

        assertEquals(TicketStatus.CLOSED, response.getStatus());
    }
}
