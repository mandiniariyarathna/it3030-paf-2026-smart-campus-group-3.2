package com.smartcampus.technician.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.smartcampus.common.exception.ResourceNotFoundException;
import com.smartcampus.technician.dto.TechnicianCreateRequest;
import com.smartcampus.technician.dto.TechnicianLoginRequest;
import com.smartcampus.technician.dto.TechnicianLoginResponse;
import com.smartcampus.technician.dto.TechnicianResponse;
import com.smartcampus.technician.model.Technician;
import com.smartcampus.technician.model.TechnicianStatus;
import com.smartcampus.technician.repository.TechnicianRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TechnicianService {

    private final TechnicianRepository technicianRepository;

    public List<TechnicianResponse> getAllTechnicians() {
        return technicianRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<TechnicianResponse> getActiveTechnicians() {
        return technicianRepository.findByStatus(TechnicianStatus.ACTIVE).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public TechnicianResponse getTechnicianById(String id) {
        Technician technician = technicianRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Technician not found with id: " + id));
        return toResponse(technician);
    }

    public TechnicianResponse createTechnician(TechnicianCreateRequest request) {
        if (technicianRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Technician with email " + request.getEmail() + " already exists");
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Password and confirm password do not match");
        }

        Technician technician = Technician.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .specialization(request.getSpecialization())
                .password(request.getPassword())
                .status(TechnicianStatus.ACTIVE)
                .assignedTicketIds(List.of())
                .build();

        Technician savedTechnician = technicianRepository.save(technician);
        return toResponse(savedTechnician);
    }

    public TechnicianResponse updateTechnician(String id, TechnicianCreateRequest request) {
        Technician technician = technicianRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Technician not found with id: " + id));

        if (!technician.getEmail().equals(request.getEmail()) && 
            technicianRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Technician with email " + request.getEmail() + " already exists");
        }

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            if (!request.getPassword().equals(request.getConfirmPassword())) {
                throw new IllegalArgumentException("Password and confirm password do not match");
            }
            technician.setPassword(request.getPassword());
        }

        technician.setName(request.getName());
        technician.setEmail(request.getEmail());
        technician.setPhone(request.getPhone());
        technician.setSpecialization(request.getSpecialization());

        Technician updatedTechnician = technicianRepository.save(technician);
        return toResponse(updatedTechnician);
    }

    public void deleteTechnician(String id) {
        if (!technicianRepository.existsById(id)) {
            throw new ResourceNotFoundException("Technician not found with id: " + id);
        }
        technicianRepository.deleteById(id);
    }

    public TechnicianResponse updateTechnicianStatus(String id, TechnicianStatus status) {
        Technician technician = technicianRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Technician not found with id: " + id));
        
        technician.setStatus(status);
        Technician updatedTechnician = technicianRepository.save(technician);
        return toResponse(updatedTechnician);
    }

    private TechnicianResponse toResponse(Technician technician) {
        return TechnicianResponse.builder()
                .id(technician.getId())
                .name(technician.getName())
                .email(technician.getEmail())
                .phone(technician.getPhone())
                .specialization(technician.getSpecialization())
                .status(technician.getStatus())
                .assignedTicketIds(technician.getAssignedTicketIds())
                .createdAt(technician.getCreatedAt())
                .updatedAt(technician.getUpdatedAt())
                .build();
    }

    public TechnicianLoginResponse authenticateTechnician(TechnicianLoginRequest request) {
        Technician technician = technicianRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid email or password"));

        if (!technician.getPassword().equals(request.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        if (technician.getStatus() != TechnicianStatus.ACTIVE) {
            throw new IllegalArgumentException("Technician account is not active");
        }

        return TechnicianLoginResponse.builder()
                .id(technician.getId())
                .name(technician.getName())
                .email(technician.getEmail())
                .phone(technician.getPhone())
                .specialization(technician.getSpecialization())
                .role("technician")
                .build();
    }
}
