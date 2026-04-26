package com.smartcampus.ticket.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.smartcampus.common.exception.ForbiddenOperationException;
import com.smartcampus.common.exception.ResourceNotFoundException;
import com.smartcampus.ticket.dto.TicketAssignmentRequest;
import com.smartcampus.ticket.dto.TicketCommentCreateRequest;
import com.smartcampus.ticket.dto.TicketCommentUpdateRequest;
import com.smartcampus.ticket.dto.TicketCreateRequest;
import com.smartcampus.ticket.dto.TicketResponse;
import com.smartcampus.ticket.dto.TicketStatusUpdateRequest;
import com.smartcampus.ticket.dto.TicketUpdateRequest;
import com.smartcampus.ticket.model.Ticket;
import com.smartcampus.ticket.model.TicketAttachment;
import com.smartcampus.ticket.model.TicketCategory;
import com.smartcampus.ticket.model.TicketComment;
import com.smartcampus.ticket.model.TicketPriority;
import com.smartcampus.ticket.model.TicketStatus;
import com.smartcampus.ticket.repository.TicketRepository;
import com.smartcampus.technician.model.Technician;
import com.smartcampus.technician.model.TechnicianStatus;
import com.smartcampus.technician.repository.TechnicianRepository;

@Service
public class TicketService {

    private static final long MAX_ATTACHMENT_SIZE_BYTES = 5L * 1024 * 1024;
    private static final int MAX_ATTACHMENTS_PER_TICKET = 3;
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png");
    private static final String ROLE_ADMIN = "ADMIN";
    private static final String ROLE_TECHNICIAN = "TECHNICIAN";
    private static final String ROLE_USER = "USER";
    private static final Path TICKET_UPLOAD_DIR = Path.of("uploads", "tickets");

    private final TicketRepository ticketRepository;
    private final MongoTemplate mongoTemplate;
    private final TechnicianRepository technicianRepository;

    public TicketService(TicketRepository ticketRepository, MongoTemplate mongoTemplate,
            TechnicianRepository technicianRepository) {
        this.ticketRepository = ticketRepository;
        this.mongoTemplate = mongoTemplate;
        this.technicianRepository = technicianRepository;
    }

    public TicketResponse createTicket(String reporterId, TicketCreateRequest request, List<MultipartFile> attachments) {
        String resolvedReporterId = normalizeUserId(reporterId);
        List<TicketAttachment> savedAttachments = storeAttachments(attachments);

        Ticket ticket = Ticket.builder()
                .reporterId(resolvedReporterId)
                .resourceId(StringUtils.hasText(request.getResourceId()) ? request.getResourceId() : null)
                .location(request.getLocation().trim())
                .category(request.getCategory())
                .description(request.getDescription().trim())
                .priority(request.getPriority())
                .status(TicketStatus.OPEN)
                .contactDetails(request.getContactDetails().trim())
                .attachments(savedAttachments)
                .comments(new ArrayList<>())
                .build();

        return toResponse(ticketRepository.save(ticket));
    }

    public List<TicketResponse> getTickets(String actorId, String actorRole, TicketStatus status,
            TicketPriority priority, TicketCategory category) {
        String normalizedRole = normalizeRole(actorRole);
        Stream<Ticket> ticketStream = getRoleScopedTickets(actorId, normalizedRole).stream();

        if (status != null) {
            ticketStream = ticketStream.filter(ticket -> status == ticket.getStatus());
        }

        if (priority != null) {
            ticketStream = ticketStream.filter(ticket -> priority == ticket.getPriority());
        }

        if (category != null) {
            ticketStream = ticketStream.filter(ticket -> category == ticket.getCategory());
        }

        return ticketStream
                .sorted((left, right) -> right.getCreatedAt().compareTo(left.getCreatedAt()))
                .map(this::toResponse)
                .toList();
    }

    public TicketResponse getTicketById(String ticketId, String actorId, String actorRole) {
        Ticket ticket = findTicket(ticketId);
        ensureCanView(ticket, actorId, normalizeRole(actorRole));
        return toResponse(ticket);
    }

    public TicketResponse updateTicket(String ticketId, String actorId, String actorRole, TicketUpdateRequest request) {
        Ticket ticket = findTicket(ticketId);

        String normalizedRole = normalizeRole(actorRole);
        String normalizedActorId = normalizeUserId(actorId);
        boolean isOwner = normalizedActorId.equals(ticket.getReporterId());

        if (!isOwner && !ROLE_ADMIN.equals(normalizedRole)) {
            throw new ForbiddenOperationException("You can only edit your own tickets");
        }

        if (ticket.getStatus() != TicketStatus.OPEN) {
            throw new IllegalArgumentException("Only open tickets can be edited");
        }

        ticket.setLocation(request.getLocation().trim());
        ticket.setCategory(request.getCategory());
        ticket.setDescription(request.getDescription().trim());
        ticket.setPriority(request.getPriority());
        ticket.setContactDetails(request.getContactDetails().trim());

        return toResponse(ticketRepository.save(ticket));
    }

    public TicketResponse updateStatus(String ticketId, String actorRole, TicketStatusUpdateRequest request) {
        String normalizedRole = normalizeRole(actorRole);
        if (!ROLE_ADMIN.equals(normalizedRole) && !ROLE_TECHNICIAN.equals(normalizedRole)) {
            throw new ForbiddenOperationException("Only admin or technician can update ticket status");
        }

        Ticket ticket = findTicket(ticketId);
        TicketStatus nextStatus = request.getStatus();
        validateStatusTransition(ticket.getStatus(), nextStatus);

        if (nextStatus == TicketStatus.RESOLVED && !StringUtils.hasText(request.getResolutionNote())) {
            throw new IllegalArgumentException("Resolution note is required when resolving a ticket");
        }

        if (nextStatus == TicketStatus.REJECTED && !StringUtils.hasText(request.getRejectionReason())) {
            throw new IllegalArgumentException("Rejection reason is required when rejecting a ticket");
        }

        ticket.setStatus(nextStatus);
        ticket.setResolutionNote(nextStatus == TicketStatus.RESOLVED ? request.getResolutionNote().trim() : null);
        ticket.setRejectionReason(nextStatus == TicketStatus.REJECTED ? request.getRejectionReason().trim() : null);
        ticket.setResolvedAt(nextStatus == TicketStatus.RESOLVED ? LocalDateTime.now() : null);
        ticket.setClosedAt(nextStatus == TicketStatus.CLOSED ? LocalDateTime.now() : null);

        return toResponse(ticketRepository.save(ticket));
    }

    public TicketResponse assignTechnician(String ticketId, String actorRole, TicketAssignmentRequest request) {
        if (!ROLE_ADMIN.equals(normalizeRole(actorRole))) {
            throw new ForbiddenOperationException("Only admin can assign technicians");
        }

        Ticket ticket = findTicket(ticketId);
        String technicianId = request.getTechnicianId().trim();
        Technician technician = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician not found: " + technicianId));

        if (technician.getStatus() != TechnicianStatus.ACTIVE) {
            throw new IllegalArgumentException("Only active technicians can be assigned");
        }

        if (!isTechnicianCompatibleWithCategory(ticket.getCategory(), technician)) {
            throw new IllegalArgumentException("Technician " + technician.getName()
                    + " cannot be assigned to a " + ticket.getCategory() + " ticket");
        }

        ticket.setAssignedTechnicianId(technicianId);
        ticket.setAssignedAt(LocalDateTime.now());

        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }

        return toResponse(ticketRepository.save(ticket));
    }

    public void deleteTicket(String ticketId, String actorId, String actorRole) {
        Ticket ticket = findTicket(ticketId);
        String normalizedRole = normalizeRole(actorRole);
        String normalizedActorId = normalizeUserId(actorId);
        boolean isOwner = normalizedActorId.equals(ticket.getReporterId());

        if (!isOwner && !ROLE_ADMIN.equals(normalizedRole)) {
            throw new ForbiddenOperationException("You can only delete your own tickets");
        }

        if (ticket.getStatus() != TicketStatus.OPEN) {
            throw new IllegalArgumentException("Only open tickets can be deleted");
        }

        ticketRepository.deleteById(ticketId);
    }

    public TicketResponse addComment(String ticketId, String actorId, String actorRole, TicketCommentCreateRequest request) {
        Ticket ticket = findTicket(ticketId);
        ensureCanView(ticket, actorId, normalizeRole(actorRole));

        LocalDateTime now = LocalDateTime.now();
        TicketComment comment = TicketComment.builder()
                .commentId(new ObjectId().toHexString())
                .authorId(normalizeUserId(actorId))
                .content(request.getContent().trim())
                .isEdited(false)
                .createdAt(now)
                .updatedAt(now)
                .build();

        Query query = Query.query(Criteria.where("id").is(ticketId));
        Update update = new Update().push("comments", comment);
        mongoTemplate.updateFirst(query, update, Ticket.class);

        return toResponse(findTicket(ticketId));
    }

    public TicketResponse editComment(String ticketId, String commentId, String actorId, String actorRole,
            TicketCommentUpdateRequest request) {
        Ticket ticket = findTicket(ticketId);
        TicketComment existingComment = findComment(ticket, commentId);

        String normalizedRole = normalizeRole(actorRole);
        String normalizedActorId = normalizeUserId(actorId);
        boolean isOwner = normalizedActorId.equals(existingComment.getAuthorId());

        if (!isOwner && !ROLE_ADMIN.equals(normalizedRole)) {
            throw new ForbiddenOperationException("You can only edit your own comments");
        }

        Query query = Query.query(Criteria.where("id").is(ticketId).and("comments.commentId").is(commentId));
        Update update = new Update()
                .set("comments.$.content", request.getContent().trim())
                .set("comments.$.isEdited", true)
                .set("comments.$.updatedAt", LocalDateTime.now());
        mongoTemplate.updateFirst(query, update, Ticket.class);

        return toResponse(findTicket(ticketId));
    }

    public TicketResponse deleteComment(String ticketId, String commentId, String actorId, String actorRole) {
        Ticket ticket = findTicket(ticketId);
        TicketComment existingComment = findComment(ticket, commentId);

        String normalizedRole = normalizeRole(actorRole);
        String normalizedActorId = normalizeUserId(actorId);
        boolean isOwner = normalizedActorId.equals(existingComment.getAuthorId());

        if (!isOwner && !ROLE_ADMIN.equals(normalizedRole)) {
            throw new ForbiddenOperationException("You can only delete your own comments");
        }

        Query query = Query.query(Criteria.where("id").is(ticketId));
        Update update = new Update().pull("comments", new Document("commentId", commentId));
        mongoTemplate.updateFirst(query, update, Ticket.class);

        return toResponse(findTicket(ticketId));
    }

    private List<Ticket> getRoleScopedTickets(String actorId, String normalizedRole) {
        if (ROLE_USER.equals(normalizedRole)) {
            return ticketRepository.findByReporterId(normalizeUserId(actorId));
        }

        if (ROLE_TECHNICIAN.equals(normalizedRole) && StringUtils.hasText(actorId)) {
            return ticketRepository.findByAssignedTechnicianId(actorId.trim());
        }

        return ticketRepository.findAll();
    }

    private void ensureCanView(Ticket ticket, String actorId, String normalizedRole) {
        if (ROLE_USER.equals(normalizedRole) && !normalizeUserId(actorId).equals(ticket.getReporterId())) {
            throw new ForbiddenOperationException("You are not allowed to access this ticket");
        }
    }

    private TicketComment findComment(Ticket ticket, String commentId) {
        return ticket.getComments().stream()
                .filter(comment -> commentId.equals(comment.getCommentId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found: " + commentId));
    }

    private Ticket findTicket(String ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketId));
    }

    private void validateStatusTransition(TicketStatus current, TicketStatus next) {
        if (current == next) {
            return;
        }

        boolean allowed = switch (current) {
            case OPEN -> next == TicketStatus.IN_PROGRESS || next == TicketStatus.REJECTED || next == TicketStatus.CLOSED;
            case IN_PROGRESS -> next == TicketStatus.RESOLVED || next == TicketStatus.REJECTED || next == TicketStatus.CLOSED;
            case RESOLVED -> next == TicketStatus.CLOSED || next == TicketStatus.IN_PROGRESS;
            case REJECTED, CLOSED -> false;
        };

        if (!allowed) {
            throw new IllegalArgumentException("Invalid status transition from " + current + " to " + next);
        }
    }

    private List<TicketAttachment> storeAttachments(List<MultipartFile> attachments) {
        if (attachments == null || attachments.isEmpty()) {
            return List.of();
        }

        if (attachments.size() > MAX_ATTACHMENTS_PER_TICKET) {
            throw new IllegalArgumentException("A ticket can contain at most 3 attachments");
        }

        ensureUploadDirectory();
        List<TicketAttachment> result = new ArrayList<>();

        for (MultipartFile file : attachments) {
            if (file == null || file.isEmpty()) {
                continue;
            }

            validateAttachment(file);

            String originalName = file.getOriginalFilename() == null ? "attachment" : file.getOriginalFilename();
            String extension = getFileExtension(originalName);
            String storedFileName = UUID.randomUUID() + extension;

            Path targetPath = TICKET_UPLOAD_DIR.resolve(storedFileName).normalize();
            if (!targetPath.startsWith(TICKET_UPLOAD_DIR)) {
                throw new IllegalArgumentException("Invalid file name");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException exception) {
                throw new IllegalArgumentException("Failed to store attachment: " + originalName);
            }

            result.add(TicketAttachment.builder()
                    .attachmentId(new ObjectId().toHexString())
                    .fileName(originalName)
                    .storedFileName(storedFileName)
                    .contentType(file.getContentType())
                    .fileSize(file.getSize())
                    .uploadedAt(LocalDateTime.now())
                    .build());
        }

        return result;
    }

    private void ensureUploadDirectory() {
        try {
            Files.createDirectories(TICKET_UPLOAD_DIR);
        } catch (IOException exception) {
            throw new IllegalArgumentException("Failed to initialize upload directory");
        }
    }

    private void validateAttachment(MultipartFile file) {
        if (file.getSize() > MAX_ATTACHMENT_SIZE_BYTES) {
            throw new IllegalArgumentException("Attachment exceeds maximum size of 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Only PNG and JPEG images are allowed");
        }
    }

    private String getFileExtension(String fileName) {
        String cleanedName = Path.of(fileName).getFileName().toString();
        int extensionIndex = cleanedName.lastIndexOf('.');
        return extensionIndex >= 0 ? cleanedName.substring(extensionIndex) : "";
    }

    private String normalizeRole(String actorRole) {
        return StringUtils.hasText(actorRole) ? actorRole.trim().toUpperCase() : ROLE_USER;
    }

    private String normalizeUserId(String actorId) {
        if (!StringUtils.hasText(actorId)) {
            throw new IllegalArgumentException("X-User-Id header is required");
        }

        return actorId.trim();
    }

    private boolean isTechnicianCompatibleWithCategory(TicketCategory category, Technician technician) {
        if (category == null || technician == null) {
            return false;
        }

        String specialization = technician.getSpecialization() == null ? "" : technician.getSpecialization().trim().toLowerCase();

        return switch (category) {
            case MAINTENANCE, FACILITY_RESOURCE_BASED, SAFETY_SECURITY -> specialization.equals("maintenance")
                || specialization.equals("electrical");
            case IT_TECHNICAL -> specialization.equals("network")
                || specialization.equals("hardware")
                || specialization.equals("software");
            case GENERAL -> true;
            case ELECTRICAL -> specialization.equals("electrical");
            case PLUMBING, HVAC, STRUCTURAL -> specialization.equals("maintenance");
            case IT_EQUIPMENT -> specialization.equals("network")
                    || specialization.equals("hardware")
                    || specialization.equals("software");
            case OTHER -> true;
        };
    }

    private TicketResponse toResponse(Ticket ticket) {
        return TicketResponse.builder()
                .id(ticket.getId())
                .reporterId(ticket.getReporterId())
                .resourceId(ticket.getResourceId())
                .location(ticket.getLocation())
                .category(ticket.getCategory())
                .description(ticket.getDescription())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .contactDetails(ticket.getContactDetails())
                .assignedTechnicianId(ticket.getAssignedTechnicianId())
                .assignedAt(ticket.getAssignedAt())
                .resolutionNote(ticket.getResolutionNote())
                .rejectionReason(ticket.getRejectionReason())
                .resolvedAt(ticket.getResolvedAt())
                .closedAt(ticket.getClosedAt())
                .attachments(ticket.getAttachments() == null ? List.of() : ticket.getAttachments())
                .comments(ticket.getComments() == null ? List.of() : ticket.getComments())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }
}
