package com.smartcampus.booking.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.smartcampus.booking.dto.BookingRequestDTO;
import com.smartcampus.booking.model.Booking;
import com.smartcampus.booking.model.BookingStatus;
import com.smartcampus.booking.repository.BookingRepository;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        bookingService = new BookingService(bookingRepository);
    }

    @Test
    void shouldRejectCreateBookingWhenConflictExists() {
        BookingRequestDTO request = buildRequest();
        ObjectId resourceId = new ObjectId("661000000000000000000001");
        Booking approved = Booking.builder().id("b-1").resourceId(resourceId).date(request.getDate())
                .startTime("10:00").endTime("11:00").status(BookingStatus.APPROVED).build();

        when(bookingRepository.findConflictingBookings(resourceId, request.getDate(), "10:30", "11:30"))
                .thenReturn(List.of(approved));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> bookingService.createBooking(request));

        assertTrue(exception.getMessage().contains("conflicts"));
    }

    @Test
    void shouldCreateBookingWhenNoConflictExists() {
        BookingRequestDTO request = buildRequest();
                ObjectId resourceId = new ObjectId("661000000000000000000001");

                when(bookingRepository.findConflictingBookings(resourceId, request.getDate(), "10:30", "11:30"))
                .thenReturn(List.of());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking booking = invocation.getArgument(0);
            booking.setId("created-id");
            return booking;
        });

        var created = bookingService.createBooking(request);

        assertEquals("created-id", created.getId());
        assertEquals(BookingStatus.PENDING, created.getStatus());
    }

    @Test
    void shouldApprovePendingBooking() {
        ObjectId resourceId = new ObjectId("661000000000000000000001");
        ObjectId userId = new ObjectId("660000000000000000000001");
        Booking pending = Booking.builder()
                .id("book-1")
                .userId(userId)
                .resourceId(resourceId)
                .date(LocalDate.now().plusDays(1).toString())
                .startTime("10:00")
                .endTime("11:00")
                .purpose("Lecture")
                .status(BookingStatus.PENDING)
                .build();

        when(bookingRepository.findById("book-1")).thenReturn(Optional.of(pending));
        when(bookingRepository.findConflictingBookings(pending.getResourceId(), pending.getDate(), pending.getStartTime(),
                pending.getEndTime())).thenReturn(List.of());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var approved = bookingService.approveBooking("book-1", "admin-1");

        assertEquals(BookingStatus.APPROVED, approved.getStatus());
        assertEquals("admin-1", approved.getReviewedBy());
    }

    @Test
    void shouldPreventUserCancellingAnotherUsersBooking() {
        ObjectId resourceId = new ObjectId("661000000000000000000001");
        Booking booking = Booking.builder()
                .id("book-2")
                .userId(new ObjectId("660000000000000000000002"))
                .resourceId(resourceId)
                .date(LocalDate.now().plusDays(1).toString())
                .startTime("09:00")
                .endTime("10:00")
                .purpose("Exam")
                .status(BookingStatus.APPROVED)
                .build();

        when(bookingRepository.findById("book-2")).thenReturn(Optional.of(booking));

        assertThrows(ResponseStatusException.class,
                () -> bookingService.cancelBooking("book-2", "USER", "other-user"));
    }

    @Test
    void shouldRejectPastDateBooking() {
        BookingRequestDTO request = BookingRequestDTO.builder()
                .userId("u-1")
                .resourceId("r-1")
                .date(LocalDate.now().minusDays(1).toString())
                .startTime("08:00")
                .endTime("09:00")
                .purpose("Practice")
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> bookingService.createBooking(request));

        assertTrue(exception.getMessage().contains("past"));
    }

    @Test
    void shouldRejectInvalidTimeRange() {
        BookingRequestDTO request = BookingRequestDTO.builder()
                .userId("u-1")
                .resourceId("r-1")
                .date(LocalDate.now().plusDays(1).toString())
                .startTime("12:00")
                .endTime("11:00")
                .purpose("Practice")
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> bookingService.createBooking(request));

        assertTrue(exception.getMessage().contains("earlier"));
    }

    @Test
    void shouldReturnUserScopedBookings() {
                ObjectId userId = new ObjectId("660000000000000000000001");
                Booking own = Booking.builder().id("own").userId(userId).status(BookingStatus.PENDING).build();

                when(bookingRepository.findByUserId(userId)).thenReturn(List.of(own));

                var results = bookingService.getBookings("USER", userId.toHexString(), null);

        assertEquals(1, results.size());
                verify(bookingRepository).findByUserId(userId);
    }

    private BookingRequestDTO buildRequest() {
        return BookingRequestDTO.builder()
                .userId("u-1")
                                .resourceId("661000000000000000000001")
                .date(LocalDate.now().plusDays(1).toString())
                .startTime("10:30")
                .endTime("11:30")
                .purpose("Department meeting")
                .expectedAttendees(10)
                .build();
    }
}
