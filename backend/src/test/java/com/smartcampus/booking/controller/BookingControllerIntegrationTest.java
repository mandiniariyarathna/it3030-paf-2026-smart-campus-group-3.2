package com.smartcampus.booking.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.booking.dto.BookingRequestDTO;
import com.smartcampus.booking.model.Booking;
import com.smartcampus.booking.model.BookingStatus;
import com.smartcampus.booking.repository.BookingRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BookingControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BookingRepository bookingRepository;

    @BeforeEach
    void setup() {
        bookingRepository.deleteAll();
    }

    @Test
    void shouldCreateBookingRequest() throws Exception {
        BookingRequestDTO request = BookingRequestDTO.builder()
                .userId("user-1")
                .resourceId("resource-1")
                .date(LocalDate.now().plusDays(2).toString())
                .startTime("10:00")
                .endTime("11:00")
                .purpose("Project review")
                .expectedAttendees(8)
                .build();

        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    void shouldListUserBookingsOnlyForUserRole() throws Exception {
        Booking own = Booking.builder()
                .userId("user-1")
                .resourceId("resource-1")
                .date(LocalDate.now().plusDays(1).toString())
                .startTime("09:00")
                .endTime("10:00")
                .purpose("Class")
                .status(BookingStatus.PENDING)
                .build();

        Booking other = Booking.builder()
                .userId("user-2")
                .resourceId("resource-2")
                .date(LocalDate.now().plusDays(1).toString())
                .startTime("11:00")
                .endTime("12:00")
                .purpose("Meeting")
                .status(BookingStatus.PENDING)
                .build();

        bookingRepository.save(own);
        bookingRepository.save(other);

        mockMvc.perform(get("/api/v1/bookings")
                        .header("X-User-Role", "USER")
                        .header("X-User-Id", "user-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].userId").value("user-1"));
    }

    @Test
    void shouldApprovePendingBookingForAdmin() throws Exception {
        Booking booking = bookingRepository.save(Booking.builder()
                .userId("user-1")
                .resourceId("resource-1")
                .date(LocalDate.now().plusDays(2).toString())
                .startTime("10:00")
                .endTime("11:00")
                .purpose("Class")
                .status(BookingStatus.PENDING)
                .build());

        mockMvc.perform(put("/api/v1/bookings/{id}/approve", booking.getId())
                        .header("X-User-Role", "ADMIN")
                        .header("X-User-Id", "admin-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"));
    }

    @Test
    void shouldRejectBookingForAdmin() throws Exception {
        Booking booking = bookingRepository.save(Booking.builder()
                .userId("user-1")
                .resourceId("resource-1")
                .date(LocalDate.now().plusDays(2).toString())
                .startTime("12:00")
                .endTime("13:00")
                .purpose("Seminar")
                .status(BookingStatus.PENDING)
                .build());

        mockMvc.perform(put("/api/v1/bookings/{id}/reject", booking.getId())
                        .header("X-User-Role", "ADMIN")
                        .header("X-User-Id", "admin-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("rejectionReason", "Resource unavailable"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"))
                .andExpect(jsonPath("$.data.rejectionReason").value("Resource unavailable"));
    }

    @Test
    void shouldCancelApprovedBooking() throws Exception {
        Booking booking = bookingRepository.save(Booking.builder()
                .userId("user-1")
                .resourceId("resource-1")
                .date(LocalDate.now().plusDays(2).toString())
                .startTime("14:00")
                .endTime("15:00")
                .purpose("Club event")
                .status(BookingStatus.APPROVED)
                .build());

        mockMvc.perform(put("/api/v1/bookings/{id}/cancel", booking.getId())
                        .header("X-User-Role", "USER")
                        .header("X-User-Id", "user-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }

    @Test
    void shouldListBookingsForResource() throws Exception {
        bookingRepository.save(Booking.builder()
                .userId("user-1")
                .resourceId("resource-x")
                .date(LocalDate.now().plusDays(2).toString())
                .startTime("08:00")
                .endTime("09:00")
                .purpose("Lab session")
                .status(BookingStatus.PENDING)
                .build());

        bookingRepository.save(Booking.builder()
                .userId("user-2")
                .resourceId("resource-y")
                .date(LocalDate.now().plusDays(2).toString())
                .startTime("08:00")
                .endTime("09:00")
                .purpose("Other")
                .status(BookingStatus.PENDING)
                .build());

        mockMvc.perform(get("/api/v1/resources/{id}/bookings", "resource-x"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].resourceId").value("resource-x"));
    }
}
