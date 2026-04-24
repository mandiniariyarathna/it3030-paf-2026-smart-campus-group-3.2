package com.smartcampus.resource.config;

import java.time.DayOfWeek;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.smartcampus.resource.model.AvailabilityWindow;
import com.smartcampus.resource.model.Resource;
import com.smartcampus.resource.model.ResourceStatus;
import com.smartcampus.resource.model.ResourceType;
import com.smartcampus.resource.repository.ResourceRepository;

@Configuration
public class ResourceDataSeeder {

    @Bean
    CommandLineRunner seedResources(ResourceRepository resourceRepository) {
        return args -> {
            if (resourceRepository.count() > 0) {
                return;
            }

            Resource lectureHall = Resource.builder()
                    .name("Main Lecture Hall A")
                    .type(ResourceType.LECTURE_HALL)
                    .capacity(180)
                    .location("Block A, Floor 1")
                    .status(ResourceStatus.ACTIVE)
                    .description("Large lecture hall with projector and audio system")
                    .createdBy("seed-admin")
                    .availabilityWindows(List.of(
                            AvailabilityWindow.builder().dayOfWeek(DayOfWeek.MONDAY).startTime("08:00")
                                    .endTime("18:00").build(),
                            AvailabilityWindow.builder().dayOfWeek(DayOfWeek.TUESDAY).startTime("08:00")
                                    .endTime("18:00").build()))
                    .build();

            Resource lab = Resource.builder()
                    .name("Computer Lab 2")
                    .type(ResourceType.LAB)
                    .capacity(45)
                    .location("Block C, Floor 2")
                    .status(ResourceStatus.ACTIVE)
                    .description("High-performance machines for development and AI labs")
                    .createdBy("seed-admin")
                    .availabilityWindows(List.of(
                            AvailabilityWindow.builder().dayOfWeek(DayOfWeek.WEDNESDAY).startTime("09:00")
                                    .endTime("17:00").build(),
                            AvailabilityWindow.builder().dayOfWeek(DayOfWeek.THURSDAY).startTime("09:00")
                                    .endTime("17:00").build()))
                    .build();

            resourceRepository.saveAll(List.of(lectureHall, lab));
        };
    }
}
