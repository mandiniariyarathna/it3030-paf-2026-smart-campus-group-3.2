package com.smartcampus.ticket.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.ticket.dto.TicketCommentCreateRequest;
import com.smartcampus.ticket.dto.TicketCommentUpdateRequest;
import com.smartcampus.ticket.dto.TicketResponse;
import com.smartcampus.ticket.service.TicketService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/tickets/{ticketId}/comments")
@Validated
public class TicketCommentController {

    private final TicketService ticketService;

    public TicketCommentController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> addComment(
            @PathVariable String ticketId,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Valid @RequestBody TicketCommentCreateRequest request) {

        TicketResponse data = ticketService.addComment(ticketId, userId, userRole, request);
        return ResponseEntity.ok(buildResponse(data, "Comment added successfully"));
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<Map<String, Object>> editComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Valid @RequestBody TicketCommentUpdateRequest request) {

        TicketResponse data = ticketService.editComment(ticketId, commentId, userId, userRole, request);
        return ResponseEntity.ok(buildResponse(data, "Comment updated successfully"));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Map<String, Object>> deleteComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {

        TicketResponse data = ticketService.deleteComment(ticketId, commentId, userId, userRole);
        return ResponseEntity.ok(buildResponse(data, "Comment deleted successfully"));
    }

    private Map<String, Object> buildResponse(Object data, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", data);
        response.put("message", message);
        return response;
    }
}
