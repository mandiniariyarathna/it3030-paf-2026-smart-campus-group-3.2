package com.smartcampus.config;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

import org.bson.Document;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseConnectionVerifier implements CommandLineRunner {

    private static final List<String> REQUIRED_TICKET_CATEGORIES = List.of(
            "MAINTENANCE",
            "IT_TECHNICAL",
            "FACILITY_RESOURCE_BASED",
            "SAFETY_SECURITY",
            "GENERAL",
            "ELECTRICAL",
            "PLUMBING",
            "IT_EQUIPMENT",
            "HVAC",
            "STRUCTURAL",
            "OTHER");

    private final MongoTemplate mongoTemplate;

    public DatabaseConnectionVerifier(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(String... args) {
        mongoTemplate.executeCommand(new Document("ping", 1));
        ensureTicketCategoryValidatorSupportsCurrentEnums();
        System.out.println("Database connected successfully");
    }

    private void ensureTicketCategoryValidatorSupportsCurrentEnums() {
        try {
            Document listCollectionsResponse = mongoTemplate.executeCommand(new Document("listCollections", 1)
                    .append("filter", new Document("name", "tickets")));

            @SuppressWarnings("unchecked")
            List<Document> firstBatch = (List<Document>) listCollectionsResponse
                    .get("cursor", Document.class)
                    .get("firstBatch");

            if (firstBatch == null || firstBatch.isEmpty()) {
                return;
            }

            Document collectionInfo = firstBatch.getFirst();
            Document options = collectionInfo.get("options", Document.class);
            if (options == null) {
                return;
            }

            Document validator = options.get("validator", Document.class);
            if (validator == null) {
                return;
            }

            Document jsonSchema = validator.get("$jsonSchema", Document.class);
            if (jsonSchema == null) {
                return;
            }

            Document properties = jsonSchema.get("properties", Document.class);
            if (properties == null) {
                return;
            }

            Document categoryProperty = properties.get("category", Document.class);
            if (categoryProperty == null) {
                return;
            }

            List<Object> existingEnumValues = categoryProperty.getList("enum", Object.class);
            if (existingEnumValues == null) {
                return;
            }

            LinkedHashSet<String> mergedEnumValues = new LinkedHashSet<>();
            existingEnumValues.forEach(value -> {
                if (value != null) {
                    mergedEnumValues.add(value.toString());
                }
            });

            int originalSize = mergedEnumValues.size();
            mergedEnumValues.addAll(REQUIRED_TICKET_CATEGORIES);

            if (mergedEnumValues.size() == originalSize) {
                return;
            }

            categoryProperty.put("enum", new ArrayList<>(mergedEnumValues));

            mongoTemplate.executeCommand(new Document("collMod", "tickets")
                    .append("validator", validator)
                    .append("validationLevel", "moderate"));

            System.out.println("Updated MongoDB tickets.category validator enum values.");
        } catch (Exception exception) {
            System.err.println("Warning: unable to update MongoDB tickets category validator: "
                    + exception.getMessage());
        }
    }
}
