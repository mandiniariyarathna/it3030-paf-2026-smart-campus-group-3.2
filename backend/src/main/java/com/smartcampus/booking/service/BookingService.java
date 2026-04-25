package com.smartcampus.booking.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.smartcampus.booking.dto.BookingDTO;
import com.smartcampus.booking.dto.BookingRequestDTO;
import com.smartcampus.booking.model.Booking;
import com.smartcampus.booking.model.BookingStatus;
import com.smartcampus.booking.repository.BookingRepository;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;

    public BookingService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    public BookingDTO createBooking(BookingRequestDTO request) {
        validateDateAndTime(request.getDate(), request.getStartTime(), request.getEndTime());

        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                request.getResourceId(),
                request.getDate(),
                request.getStartTime(),
                request.getEndTime());

        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException("Requested time slot conflicts with an approved booking");
        }

        Booking booking = Booking.builder()
                .userId(request.getUserId())
                .resourceId(request.getResourceId())
                .date(request.getDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .purpose(request.getPurpose())
                .expectedAttendees(request.getExpectedAttendees())
                .status(BookingStatus.PENDING)
                .build();

        return toDto(bookingRepository.save(booking));
    }

    public List<BookingDTO> getBookings(String userRole, String userId, BookingStatus status) {
        List<Booking> bookings;
        if (isAdmin(userRole)) {
            bookings = status == null ? bookingRepository.findAll() : bookingRepository.findByStatus(status);
        } else {
            bookings = bookingRepository.findByUserId(userId);
            if (status != null) {
                bookings = bookings.stream().filter(booking -> status == booking.getStatus()).toList();
            }
        }

        return bookings.stream().map(this::toDto).toList();
    }

    public BookingDTO getBookingById(String bookingId, String userRole, String userId) {
        Booking booking = getBookingEntityById(bookingId);

        if (!isAdmin(userRole) && !booking.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only access your own bookings");
        }

        return toDto(booking);
    }

    public BookingDTO approveBooking(String bookingId, String reviewedBy) {
        Booking booking = getBookingEntityById(bookingId);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException("Only pending bookings can be approved");
        }

        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                booking.getResourceId(),
                booking.getDate(),
                booking.getStartTime(),
                booking.getEndTime());

        boolean hasOtherConflicts = conflicts.stream().anyMatch(conflict -> !conflict.getId().equals(booking.getId()));
        if (hasOtherConflicts) {
            throw new IllegalArgumentException("Booking cannot be approved due to a conflicting approved booking");
        }

        booking.setStatus(BookingStatus.APPROVED);
        booking.setReviewedBy(reviewedBy);
        booking.setReviewedAt(LocalDateTime.now());
        booking.setRejectionReason(null);

        return toDto(bookingRepository.save(booking));
    }

    public BookingDTO rejectBooking(String bookingId, String rejectionReason, String reviewedBy) {
        Booking booking = getBookingEntityById(bookingId);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException("Only pending bookings can be rejected");
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(rejectionReason);
        booking.setReviewedBy(reviewedBy);
        booking.setReviewedAt(LocalDateTime.now());

        return toDto(bookingRepository.save(booking));
    }

    public BookingDTO cancelBooking(String bookingId, String userRole, String userId) {
        Booking booking = getBookingEntityById(bookingId);

        if (!isAdmin(userRole) && !booking.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only cancel your own bookings");
        }

        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.APPROVED) {
            throw new IllegalArgumentException("Only pending or approved bookings can be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setReviewedBy(isAdmin(userRole) ? userId : booking.getReviewedBy());
        booking.setReviewedAt(LocalDateTime.now());

        return toDto(bookingRepository.save(booking));
    }

    public List<BookingDTO> getBookingsForResource(String resourceId) {
        return bookingRepository.findAll().stream()
                .filter(booking -> resourceId.equals(booking.getResourceId()))
                .map(this::toDto)
                .toList();
    }

    private Booking getBookingEntityById(String bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with id: " + bookingId));
    }

    private BookingDTO toDto(Booking booking) {
        return BookingDTO.builder()
                .id(booking.getId())
                .userId(booking.getUserId())
                .resourceId(booking.getResourceId())
                .date(booking.getDate())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .purpose(booking.getPurpose())
                .expectedAttendees(booking.getExpectedAttendees())
                .status(booking.getStatus())
                .rejectionReason(booking.getRejectionReason())
                .reviewedBy(booking.getReviewedBy())
                .reviewedAt(booking.getReviewedAt())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }

    private void validateDateAndTime(String date, String startTime, String endTime) {
        LocalDate bookingDate;
        LocalTime bookingStart;
        LocalTime bookingEnd;

        try {
            bookingDate = LocalDate.parse(date);
        } catch (Exception exception) {
            throw new IllegalArgumentException("Date must be a valid calendar date in YYYY-MM-DD format");
        }

        if (bookingDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Booking date cannot be in the past");
        }

        try {
            bookingStart = LocalTime.parse(startTime);
            bookingEnd = LocalTime.parse(endTime);
        } catch (Exception exception) {
            throw new IllegalArgumentException("Start and end times must be valid values in HH:mm format");
        }

        if (!bookingStart.isBefore(bookingEnd)) {
            throw new IllegalArgumentException("Start time must be earlier than end time");
        }
    }

    private boolean isAdmin(String userRole) {
        return "ADMIN".equalsIgnoreCase(userRole);
    }
}
