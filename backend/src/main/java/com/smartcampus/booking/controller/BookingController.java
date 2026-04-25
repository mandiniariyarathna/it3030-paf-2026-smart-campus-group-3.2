package com.smartcampus.booking.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.smartcampus.booking.dto.BookingDTO;
import com.smartcampus.booking.dto.BookingRequestDTO;
import com.smartcampus.booking.dto.BookingResponseDTO;
import com.smartcampus.booking.model.BookingStatus;
import com.smartcampus.booking.service.BookingService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1")
@Validated
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/bookings")
    public ResponseEntity<BookingResponseDTO> createBooking(@Valid @RequestBody BookingRequestDTO request) {
        BookingResponseDTO response = BookingResponseDTO.builder()
                .success(true)
                .data(bookingService.createBooking(request))
                .message("Booking request created successfully")
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/bookings")
    public ResponseEntity<Map<String, Object>> getBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {

        if (!isAdmin(userRole) && (userId == null || userId.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "X-User-Id header is required for user scope");
        }

        List<BookingDTO> bookings = bookingService.getBookings(userRole, userId, status);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", bookings);
        response.put("message", "Bookings fetched successfully");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<BookingResponseDTO> getBookingById(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {

        if (!isAdmin(userRole) && (userId == null || userId.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "X-User-Id header is required for user scope");
        }

        BookingResponseDTO response = BookingResponseDTO.builder()
                .success(true)
                .data(bookingService.getBookingById(id, userRole, userId))
                .message("Booking fetched successfully")
                .build();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/bookings/{id}/approve")
    public ResponseEntity<BookingResponseDTO> approveBooking(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {

        validateAdminRole(userRole);

        BookingResponseDTO response = BookingResponseDTO.builder()
                .success(true)
                .data(bookingService.approveBooking(id, userId))
                .message("Booking approved successfully")
                .build();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/bookings/{id}/reject")
    public ResponseEntity<BookingResponseDTO> rejectBooking(
            @PathVariable String id,
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {

        validateAdminRole(userRole);
        String rejectionReason = request.getOrDefault("rejectionReason", "No reason provided");

        BookingResponseDTO response = BookingResponseDTO.builder()
                .success(true)
                .data(bookingService.rejectBooking(id, rejectionReason, userId))
                .message("Booking rejected successfully")
                .build();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/bookings/{id}/cancel")
    public ResponseEntity<BookingResponseDTO> cancelBooking(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {

        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "X-User-Id header is required");
        }

        BookingResponseDTO response = BookingResponseDTO.builder()
                .success(true)
                .data(bookingService.cancelBooking(id, userRole, userId))
                .message("Booking cancelled successfully")
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/resources/{id}/bookings")
    public ResponseEntity<Map<String, Object>> getResourceBookings(@PathVariable String id) {
        List<BookingDTO> bookings = bookingService.getBookingsForResource(id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", bookings);
        response.put("message", "Resource bookings fetched successfully");

        return ResponseEntity.ok(response);
    }

    private boolean isAdmin(String userRole) {
        return "ADMIN".equalsIgnoreCase(userRole);
    }

    private void validateAdminRole(String userRole) {
        if (!isAdmin(userRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role is required for this operation");
        }
    }
}
