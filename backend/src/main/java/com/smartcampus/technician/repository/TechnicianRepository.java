package com.smartcampus.technician.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.smartcampus.technician.model.Technician;
import com.smartcampus.technician.model.TechnicianStatus;

@Repository
public interface TechnicianRepository extends MongoRepository<Technician, String> {
    Optional<Technician> findByEmail(String email);
    boolean existsByEmail(String email);
    List<Technician> findByStatus(TechnicianStatus status);
}
