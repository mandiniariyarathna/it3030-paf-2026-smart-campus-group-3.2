package com.smartcampus.resource.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.smartcampus.resource.model.Resource;
import com.smartcampus.resource.model.ResourceStatus;
import com.smartcampus.resource.model.ResourceType;

public interface ResourceRepository extends MongoRepository<Resource, String> {

    List<Resource> findByTypeAndStatus(ResourceType type, ResourceStatus status);

    List<Resource> findByCapacityGreaterThanEqual(int capacity);

    @Query("{'location': {$regex: ?0, $options: 'i'}}")
    List<Resource> findByLocationContaining(String location);
}
