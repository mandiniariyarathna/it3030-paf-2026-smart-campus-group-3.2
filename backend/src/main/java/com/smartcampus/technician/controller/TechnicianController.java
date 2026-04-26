package com.smartcampus.technician.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.technician.dto.TechnicianCreateRequest;
import com.smartcampus.technician.dto.TechnicianLoginRequest;
import com.smartcampus.technician.dto.TechnicianLoginResponse;
import com.smartcampus.technician.dto.TechnicianResponse;
import com.smartcampus.technician.model.TechnicianStatus;
import com.smartcampus.technician.service.TechnicianService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/technicians")
@RequiredArgsConstructor
public class TechnicianController {

    private final TechnicianService technicianService;

    @PostMapping("/login")
    public ResponseEntity<TechnicianLoginResponse> login(@Valid @RequestBody TechnicianLoginRequest request) {
        return ResponseEntity.ok(technicianService.authenticateTechnician(request));
    }

    @GetMapping
    public ResponseEntity<List<TechnicianResponse>> getAllTechnicians(
            @RequestParam(required = false) Boolean activeOnly) {
        if (activeOnly != null && activeOnly) {
            return ResponseEntity.ok(technicianService.getActiveTechnicians());
        }
        return ResponseEntity.ok(technicianService.getAllTechnicians());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TechnicianResponse> getTechnicianById(@PathVariable String id) {
        return ResponseEntity.ok(technicianService.getTechnicianById(id));
    }

    @PostMapping
    public ResponseEntity<TechnicianResponse> createTechnician(
            @Valid @RequestBody TechnicianCreateRequest request) {
        return ResponseEntity.ok(technicianService.createTechnician(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TechnicianResponse> updateTechnician(
            @PathVariable String id,
            @Valid @RequestBody TechnicianCreateRequest request) {
        return ResponseEntity.ok(technicianService.updateTechnician(id, request));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<TechnicianResponse> updateTechnicianStatus(
            @PathVariable String id,
            @RequestParam TechnicianStatus status) {
        return ResponseEntity.ok(technicianService.updateTechnicianStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTechnician(@PathVariable String id) {
        technicianService.deleteTechnician(id);
        return ResponseEntity.noContent().build();
    }
}
