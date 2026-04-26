package com.smartcampus.ticket.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.common.exception.ResourceNotFoundException;

@RestController
@RequestMapping("/uploads/tickets")
public class TicketUploadController {

    private static final Path TICKET_UPLOAD_DIR = Path.of("uploads", "tickets").toAbsolutePath().normalize();

    @GetMapping("/{fileName:.+}")
    public ResponseEntity<Resource> getTicketAttachment(@PathVariable String fileName) {
        try {
            Path filePath = TICKET_UPLOAD_DIR.resolve(fileName).normalize();

            if (!filePath.startsWith(TICKET_UPLOAD_DIR) || !Files.exists(filePath) || !Files.isRegularFile(filePath)) {
                throw new ResourceNotFoundException("Attachment not found: " + fileName);
            }

            UrlResource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("Attachment not found: " + fileName);
            }

            String contentType = Files.probeContentType(filePath);
            MediaType mediaType = contentType != null ? MediaType.parseMediaType(contentType)
                    : MediaType.APPLICATION_OCTET_STREAM;

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (IOException exception) {
            throw new ResourceNotFoundException("Attachment not found: " + fileName);
        }
    }
}