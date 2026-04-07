package com.smartcampus.config;

import org.bson.Document;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseConnectionVerifier implements CommandLineRunner {

    private final MongoTemplate mongoTemplate;

    public DatabaseConnectionVerifier(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(String... args) {
        mongoTemplate.executeCommand(new Document("ping", 1));
        System.out.println("Database connected successfully");
    }
}
