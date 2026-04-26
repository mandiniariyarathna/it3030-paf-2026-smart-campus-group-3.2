// MongoDB schema/bootstrap script for Smart Campus
// Usage: mongosh "<MONGODB_URI>" backend/scripts/mongodb/01_create_schema.js

const dbName = process.env.DB_NAME || "smartcampus_db";
const appDb = db.getSiblingDB(dbName);

function createCollectionIfMissing(name, options) {
  const exists = appDb.getCollectionNames().includes(name);
  if (!exists) {
    appDb.createCollection(name, options);
    print(`Created collection: ${name}`);
  } else if (options && options.validator) {
    appDb.runCommand({ collMod: name, validator: options.validator, validationLevel: "moderate" });
    print(`Updated validator: ${name}`);
  } else {
    print(`Collection already exists: ${name}`);
  }
}

createCollectionIfMissing("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "name", "role", "provider", "providerId", "createdAt", "updatedAt"],
      properties: {
        email: { bsonType: "string" },
        name: { bsonType: "string" },
        picture: { bsonType: ["string", "null"] },
        role: { enum: ["USER", "ADMIN", "TECHNICIAN"] },
        provider: { bsonType: "string" },
        providerId: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate"
});

createCollectionIfMissing("resources", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "type", "capacity", "location", "status", "createdBy", "createdAt", "updatedAt"],
      properties: {
        name: { bsonType: "string", maxLength: 100 },
        type: { enum: ["LECTURE_HALL", "LAB", "MEETING_ROOM", "EQUIPMENT"] },
        capacity: { bsonType: ["int", "long", "double", "decimal"], minimum: 1 },
        location: { bsonType: "string", maxLength: 200 },
        status: { enum: ["ACTIVE", "OUT_OF_SERVICE", "UNDER_MAINTENANCE"] },
        description: { bsonType: ["string", "null"], maxLength: 500 },
        availabilityWindows: {
          bsonType: ["array", "null"],
          items: {
            bsonType: "object",
            required: ["dayOfWeek", "startTime", "endTime"],
            properties: {
              dayOfWeek: {
                enum: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
              },
              startTime: { bsonType: "string" },
              endTime: { bsonType: "string" }
            }
          }
        },
        createdBy: { bsonType: "objectId" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate"
});

createCollectionIfMissing("bookings", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "resourceId", "date", "startTime", "endTime", "purpose", "status", "createdAt", "updatedAt"],
      properties: {
        userId: { bsonType: "objectId" },
        resourceId: { bsonType: "objectId" },
        date: { bsonType: "string" },
        startTime: { bsonType: "string" },
        endTime: { bsonType: "string" },
        purpose: { bsonType: "string", maxLength: 255 },
        expectedAttendees: { bsonType: ["int", "long", "double", "decimal", "null"], minimum: 1 },
        status: { enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] },
        rejectionReason: { bsonType: ["string", "null"], maxLength: 500 },
        reviewedBy: { bsonType: ["objectId", "null"] },
        reviewedAt: { bsonType: ["date", "null"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate"
});

createCollectionIfMissing("tickets", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["reporterId", "location", "category", "description", "priority", "status", "contactDetails", "createdAt", "updatedAt"],
      properties: {
        reporterId: { bsonType: ["string", "objectId"] },
        resourceId: { bsonType: ["string", "objectId", "null"] },
        location: { bsonType: "string", maxLength: 200 },
        category: {
          enum: [
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
            "OTHER"
          ]
        },
        description: { bsonType: "string", maxLength: 2000 },
        priority: { enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
        status: { enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"] },
        contactDetails: { bsonType: "string", maxLength: 255 },
        assignedTechnicianId: { bsonType: ["string", "objectId", "null"] },
        assignedAt: { bsonType: ["date", "null"] },
        resolutionNote: { bsonType: ["string", "null"], maxLength: 2000 },
        rejectionReason: { bsonType: ["string", "null"], maxLength: 500 },
        resolvedAt: { bsonType: ["date", "null"] },
        closedAt: { bsonType: ["date", "null"] },
        attachments: {
          bsonType: ["array", "null"],
          items: {
            bsonType: "object",
            required: ["attachmentId", "fileName", "storedFileName", "contentType", "fileSize", "uploadedAt"],
            properties: {
              attachmentId: { bsonType: "string" },
              fileName: { bsonType: "string" },
              storedFileName: { bsonType: "string" },
              contentType: { bsonType: "string" },
              fileSize: { bsonType: ["int", "long", "double", "decimal"] },
              uploadedAt: { bsonType: "date" }
            }
          }
        },
        comments: {
          bsonType: ["array", "null"],
          items: {
            bsonType: "object",
            required: ["commentId", "authorId", "content", "isEdited", "createdAt", "updatedAt"],
            properties: {
              commentId: { bsonType: "string" },
              authorId: { bsonType: ["string", "objectId"] },
              content: { bsonType: "string", maxLength: 1000 },
              isEdited: { bsonType: "bool" },
              createdAt: { bsonType: "date" },
              updatedAt: { bsonType: "date" }
            }
          }
        },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate"
});

createCollectionIfMissing("notifications", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["recipientId", "type", "title", "message", "isRead", "referenceId", "referenceType", "createdAt"],
      properties: {
        recipientId: { bsonType: "objectId" },
        type: { enum: ["BOOKING_APPROVED", "BOOKING_REJECTED", "TICKET_STATUS_CHANGED", "NEW_COMMENT", "TICKET_ASSIGNED"] },
        title: { bsonType: "string", maxLength: 100 },
        message: { bsonType: "string", maxLength: 500 },
        isRead: { bsonType: "bool" },
        referenceId: { bsonType: "string" },
        referenceType: { enum: ["BOOKING", "TICKET"] },
        createdAt: { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate"
});

// Indexes
appDb.users.createIndex({ email: 1 }, { unique: true, name: "uq_users_email" });
appDb.users.createIndex({ providerId: 1 }, { unique: true, name: "uq_users_provider_id" });

appDb.resources.createIndex({ type: 1 }, { name: "idx_resources_type" });
appDb.resources.createIndex({ status: 1 }, { name: "idx_resources_status" });
appDb.resources.createIndex({ location: "text" }, { name: "idx_resources_location_text" });

appDb.bookings.createIndex({ userId: 1 }, { name: "idx_bookings_user" });
appDb.bookings.createIndex({ resourceId: 1 }, { name: "idx_bookings_resource" });
appDb.bookings.createIndex({ resourceId: 1, date: 1, status: 1 }, { name: "idx_bookings_conflict_check" });

appDb.tickets.createIndex({ reporterId: 1 }, { name: "idx_tickets_reporter" });
appDb.tickets.createIndex({ assignedTechnicianId: 1 }, { name: "idx_tickets_assigned_technician" });
appDb.tickets.createIndex({ status: 1 }, { name: "idx_tickets_status" });
appDb.tickets.createIndex({ priority: 1 }, { name: "idx_tickets_priority" });
appDb.tickets.createIndex({ category: 1 }, { name: "idx_tickets_category" });

appDb.notifications.createIndex({ recipientId: 1, isRead: 1 }, { name: "idx_notifications_recipient_read" });
appDb.notifications.createIndex({ createdAt: 1 }, { name: "idx_notifications_created_at" });

print(`MongoDB schema setup completed for database: ${dbName}`);
