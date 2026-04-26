package com.smartcampus.ticket.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.time.LocalDateTime;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.test.context.ActiveProfiles;

import com.smartcampus.ticket.model.Ticket;
import com.smartcampus.ticket.model.TicketCategory;
import com.smartcampus.ticket.model.TicketComment;
import com.smartcampus.ticket.model.TicketPriority;
import com.smartcampus.ticket.model.TicketStatus;

@DataMongoTest
@ActiveProfiles("test")
class TicketWorkflowDataMongoTest {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @BeforeEach
    void setUp() {
        ticketRepository.deleteAll();
    }

    @Test
    void shouldPersistAndQueryTicketWorkflowData() {
        Ticket ticket = ticketRepository.save(Ticket.builder()
                .reporterId("user-901")
                .location("Library")
                .category(TicketCategory.IT_EQUIPMENT)
                .description("Printer offline")
                .priority(TicketPriority.MEDIUM)
                .status(TicketStatus.OPEN)
                .contactDetails("user-901@campus.com")
                .build());

        assertNotNull(ticket.getId());
        assertEquals(1, ticketRepository.findByReporterId("user-901").size());

        ticket.setAssignedTechnicianId("tech-901");
        ticket.setAssignedAt(LocalDateTime.now());
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticketRepository.save(ticket);

        assertEquals(1, ticketRepository.findByAssignedTechnicianId("tech-901").size());

        TicketComment comment = TicketComment.builder()
                .commentId(new ObjectId().toHexString())
                .authorId("user-901")
                .content("Please resolve this before noon.")
                .isEdited(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Query addCommentQuery = Query.query(Criteria.where("id").is(ticket.getId()));
        mongoTemplate.updateFirst(addCommentQuery, new Update().push("comments", comment), Ticket.class);

        Ticket withComment = ticketRepository.findById(ticket.getId()).orElseThrow();
        assertEquals(1, withComment.getComments().size());

        Query editCommentQuery = Query.query(Criteria.where("id").is(ticket.getId())
                .and("comments.commentId").is(comment.getCommentId()));

        mongoTemplate.updateFirst(editCommentQuery, new Update()
                .set("comments.$.content", "Updated comment content")
                .set("comments.$.isEdited", true), Ticket.class);

        Ticket edited = ticketRepository.findById(ticket.getId()).orElseThrow();
        assertEquals("Updated comment content", edited.getComments().getFirst().getContent());
        assertEquals(true, edited.getComments().getFirst().isEdited());

        mongoTemplate.updateFirst(addCommentQuery,
                new Update().pull("comments", new Document("commentId", comment.getCommentId())), Ticket.class);

        Ticket afterDelete = ticketRepository.findById(ticket.getId()).orElseThrow();
        assertEquals(0, afterDelete.getComments().size());
    }
}
