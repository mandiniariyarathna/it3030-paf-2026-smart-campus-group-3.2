package com.smartcampus.booking.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.smartcampus.booking.model.Booking;
import com.smartcampus.booking.model.BookingStatus;

public interface BookingRepository extends MongoRepository<Booking, String> {

    List<Booking> findByUserId(String userId);

    List<Booking> findByStatus(BookingStatus status);

    @Query("{ 'resourceId': ?0, 'date': ?1, 'status': 'APPROVED', 'startTime': { $lt: ?3 }, 'endTime': { $gt: ?2 } }")
    List<Booking> findConflictingBookings(String resourceId, String date, String startTime, String endTime);
}
