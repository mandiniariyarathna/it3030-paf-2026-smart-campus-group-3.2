package com.smartcampus.auth.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.smartcampus.auth.model.Role;
import com.smartcampus.auth.model.User;

public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);

    Optional<User> findByProviderId(String providerId);

    List<User> findByRole(Role role);
}
