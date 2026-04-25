package com.smartcampus.ticket.controller;

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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.smartcampus.ticket.dto.TicketAssignmentRequest;
import com.smartcampus.ticket.dto.TicketCreateRequest;
import com.smartcampus.ticket.dto.TicketResponse;
import com.smartcampus.ticket.dto.TicketStatusUpdateRequest;
import com.smartcampus.ticket.model.TicketCategory;
import com.smartcampus.ticket.model.TicketPriority;
import com.smartcampus.ticket.model.TicketStatus;
import com.smartcampus.ticket.service.TicketService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/tickets")
@Validated
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping(consumes = { "multipart/form-data" })
    public ResponseEntity<Map<String, Object>> createTicket(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestPart("ticket") TicketCreateRequest request,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments) {

        TicketResponse data = ticketService.createTicket(userId, request, attachments);
        return ResponseEntity.ok(buildResponse(data, "Ticket created successfully"));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getTickets(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketPriority priority,
            @RequestParam(required = false) TicketCategory category) {

        List<TicketResponse> data = ticketService.getTickets(userId, userRole, status, priority, category);
        return ResponseEntity.ok(buildResponse(data, "Tickets fetched successfully"));
    }

    @GetMapping("/{ticketId}")
    public ResponseEntity<Map<String, Object>> getTicketById(
            @PathVariable String ticketId,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {

        TicketResponse data = ticketService.getTicketById(ticketId, userId, userRole);
        return ResponseEntity.ok(buildResponse(data, "Ticket fetched successfully"));
    }

    @PutMapping("/{ticketId}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable String ticketId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Valid @org.springframework.web.bind.annotation.RequestBody TicketStatusUpdateRequest request) {

        TicketResponse data = ticketService.updateStatus(ticketId, userRole, request);
        return ResponseEntity.ok(buildResponse(data, "Ticket status updated successfully"));
    }

    @PutMapping("/{ticketId}/assign")
    public ResponseEntity<Map<String, Object>> assignTechnician(
            @PathVariable String ticketId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Valid @org.springframework.web.bind.annotation.RequestBody TicketAssignmentRequest request) {

        TicketResponse data = ticketService.assignTechnician(ticketId, userRole, request);
        return ResponseEntity.ok(buildResponse(data, "Ticket assigned successfully"));
    }

    @DeleteMapping("/{ticketId}")
    public ResponseEntity<Map<String, Object>> closeTicket(
            @PathVariable String ticketId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {

        TicketResponse data = ticketService.softDeleteTicket(ticketId, userRole);
        return ResponseEntity.ok(buildResponse(data, "Ticket closed successfully"));
    }

    private Map<String, Object> buildResponse(Object data, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", data);
        response.put("message", message);
        return response;
    }
}
