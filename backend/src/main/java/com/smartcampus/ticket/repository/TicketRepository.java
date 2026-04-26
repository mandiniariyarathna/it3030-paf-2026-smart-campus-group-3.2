package com.smartcampus.ticket.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.smartcampus.ticket.model.Ticket;
import com.smartcampus.ticket.model.TicketPriority;
import com.smartcampus.ticket.model.TicketStatus;

public interface TicketRepository extends MongoRepository<Ticket, String> {

    List<Ticket> findByReporterId(String reporterId);

    List<Ticket> findByAssignedTechnicianId(String technicianId);

    List<Ticket> findByStatusAndPriority(TicketStatus status, TicketPriority priority);
}
