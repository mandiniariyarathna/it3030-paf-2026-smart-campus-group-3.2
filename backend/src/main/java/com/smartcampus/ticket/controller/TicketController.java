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
import com.smartcampus.ticket.dto.TicketUpdateRequest;
import com.smartcampus.ticket.model.TicketCategory;
import com.smartcampus.ticket.model.TicketPriority;
import com.smartcampus.ticket.model.TicketStatus;
import com.smartcampus.ticket.service.TicketService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/tickets")
@Validated
@Tag(name = "Tickets", description = "Maintenance and incident ticketing APIs")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping(consumes = { "multipart/form-data" })
    @Operation(summary = "Create ticket", description = "Create a maintenance ticket with optional image attachments")
    @ApiResponse(responseCode = "200", description = "Ticket created successfully")
    public ResponseEntity<Map<String, Object>> createTicket(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestPart("ticket") TicketCreateRequest request,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments) {

        TicketResponse data = ticketService.createTicket(userId, request, attachments);
        return ResponseEntity.ok(buildResponse(data, "Ticket created successfully"));
    }

    @GetMapping
        @Operation(summary = "List tickets", description = "List tickets based on role scope with optional filters")
        @ApiResponse(responseCode = "200", description = "Tickets fetched successfully")
    public ResponseEntity<Map<String, Object>> getTickets(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Parameter(description = "Filter by ticket status")
            @RequestParam(required = false) TicketStatus status,
            @Parameter(description = "Filter by ticket priority")
            @RequestParam(required = false) TicketPriority priority,
            @Parameter(description = "Filter by ticket category")
            @RequestParam(required = false) TicketCategory category) {

        List<TicketResponse> data = ticketService.getTickets(userId, userRole, status, priority, category);
        return ResponseEntity.ok(buildResponse(data, "Tickets fetched successfully"));
    }

    @GetMapping("/{ticketId}")
    @Operation(summary = "Get ticket by id", description = "Get detailed information for a single ticket")
    @ApiResponse(responseCode = "200", description = "Ticket fetched successfully")
    public ResponseEntity<Map<String, Object>> getTicketById(
            @PathVariable String ticketId,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {

        TicketResponse data = ticketService.getTicketById(ticketId, userId, userRole);
        return ResponseEntity.ok(buildResponse(data, "Ticket fetched successfully"));
    }

    @PutMapping("/{ticketId}")
    @Operation(summary = "Edit ticket", description = "Update core ticket details while ticket is open")
    @ApiResponse(responseCode = "200", description = "Ticket updated successfully")
    public ResponseEntity<Map<String, Object>> updateTicket(
            @PathVariable String ticketId,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Valid @org.springframework.web.bind.annotation.RequestBody TicketUpdateRequest request) {

        TicketResponse data = ticketService.updateTicket(ticketId, userId, userRole, request);
        return ResponseEntity.ok(buildResponse(data, "Ticket updated successfully"));
    }

    @PutMapping("/{ticketId}/status")
    @Operation(summary = "Update ticket status", description = "Update ticket status with transition validation")
    @ApiResponse(responseCode = "200", description = "Ticket status updated successfully")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable String ticketId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Valid @org.springframework.web.bind.annotation.RequestBody TicketStatusUpdateRequest request) {

        TicketResponse data = ticketService.updateStatus(ticketId, userRole, request);
        return ResponseEntity.ok(buildResponse(data, "Ticket status updated successfully"));
    }

    @PutMapping("/{ticketId}/assign")
    @Operation(summary = "Assign technician", description = "Assign a technician to a ticket (admin only)")
    @ApiResponse(responseCode = "200", description = "Ticket assigned successfully")
    public ResponseEntity<Map<String, Object>> assignTechnician(
            @PathVariable String ticketId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Valid @org.springframework.web.bind.annotation.RequestBody TicketAssignmentRequest request) {

        TicketResponse data = ticketService.assignTechnician(ticketId, userRole, request);
        return ResponseEntity.ok(buildResponse(data, "Ticket assigned successfully"));
    }

    @DeleteMapping("/{ticketId}")
    @Operation(summary = "Delete ticket", description = "Permanently delete a ticket (ticket owner or admin only)")
    @ApiResponse(responseCode = "200", description = "Ticket deleted successfully")
    public ResponseEntity<Map<String, Object>> deleteTicket(
            @PathVariable String ticketId,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {

        ticketService.deleteTicket(ticketId, userId, userRole);
        return ResponseEntity.ok(buildResponse(null, "Ticket deleted successfully"));
    }

    private Map<String, Object> buildResponse(Object data, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", data);
        response.put("message", message);
        return response;
    }
}
