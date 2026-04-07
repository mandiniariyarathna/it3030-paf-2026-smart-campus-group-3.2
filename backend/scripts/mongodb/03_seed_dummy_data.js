// MongoDB dummy data seed script for Smart Campus
// Usage: mongosh "<MONGODB_URI>" backend/scripts/mongodb/03_seed_dummy_data.js

const dbName = process.env.DB_NAME || "smartcampus_db";
const appDb = db.getSiblingDB(dbName);

const now = new Date();

// Keep this script rerunnable in dev environments.
["notifications", "tickets", "bookings", "resources", "users"].forEach((name) => {
  if (appDb.getCollectionNames().includes(name)) {
    appDb.getCollection(name).deleteMany({});
  }
});

// Predefined IDs to keep references consistent across collections.
const ids = {
  users: {
    admin: ObjectId("660000000000000000000001"),
    student: ObjectId("660000000000000000000002"),
    technician: ObjectId("660000000000000000000003")
  },
  resources: {
    hallA: ObjectId("661000000000000000000001"),
    lab5: ObjectId("661000000000000000000002"),
    projector: ObjectId("661000000000000000000003")
  },
  bookings: {
    b1: ObjectId("662000000000000000000001"),
    b2: ObjectId("662000000000000000000002")
  },
  tickets: {
    t1: ObjectId("663000000000000000000001"),
    t2: ObjectId("663000000000000000000002")
  }
};

appDb.users.insertMany([
  {
    _id: ids.users.admin,
    email: "admin@smartcampus.local",
    name: "Campus Admin",
    picture: null,
    role: "ADMIN",
    provider: "google",
    providerId: "google-admin-001",
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.users.student,
    email: "student@smartcampus.local",
    name: "Ayesha Perera",
    picture: null,
    role: "USER",
    provider: "google",
    providerId: "google-student-001",
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.users.technician,
    email: "tech@smartcampus.local",
    name: "Nimal Silva",
    picture: null,
    role: "TECHNICIAN",
    provider: "google",
    providerId: "google-tech-001",
    createdAt: now,
    updatedAt: now
  }
]);

appDb.resources.insertMany([
  {
    _id: ids.resources.hallA,
    name: "Lecture Hall A",
    type: "LECTURE_HALL",
    capacity: 120,
    location: "Block A - Floor 2",
    status: "ACTIVE",
    description: "Main lecture hall with projector and PA system",
    availabilityWindows: [
      { dayOfWeek: "MONDAY", startTime: "08:00", endTime: "18:00" },
      { dayOfWeek: "TUESDAY", startTime: "08:00", endTime: "18:00" },
      { dayOfWeek: "WEDNESDAY", startTime: "08:00", endTime: "18:00" }
    ],
    createdBy: ids.users.admin,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.resources.lab5,
    name: "Computer Lab 5",
    type: "LAB",
    capacity: 40,
    location: "IT Building - Lab Wing",
    status: "ACTIVE",
    description: "Programming lab with 40 workstations",
    availabilityWindows: [
      { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: "THURSDAY", startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: "FRIDAY", startTime: "09:00", endTime: "17:00" }
    ],
    createdBy: ids.users.admin,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.resources.projector,
    name: "Portable Projector X1",
    type: "EQUIPMENT",
    capacity: 1,
    location: "Stores - AV Counter",
    status: "UNDER_MAINTENANCE",
    description: "Portable full HD projector",
    availabilityWindows: [],
    createdBy: ids.users.admin,
    createdAt: now,
    updatedAt: now
  }
]);

appDb.bookings.insertMany([
  {
    _id: ids.bookings.b1,
    userId: ids.users.student,
    resourceId: ids.resources.hallA,
    date: "2026-04-15",
    startTime: "10:00",
    endTime: "12:00",
    purpose: "AI Club weekly seminar",
    expectedAttendees: 75,
    status: "APPROVED",
    rejectionReason: null,
    reviewedBy: ids.users.admin,
    reviewedAt: now,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.bookings.b2,
    userId: ids.users.student,
    resourceId: ids.resources.lab5,
    date: "2026-04-16",
    startTime: "13:00",
    endTime: "15:00",
    purpose: "DBMS practical session",
    expectedAttendees: 35,
    status: "PENDING",
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: now,
    updatedAt: now
  }
]);

appDb.tickets.insertMany([
  {
    _id: ids.tickets.t1,
    reporterId: ids.users.student,
    resourceId: ids.resources.lab5,
    location: "IT Building - Lab Wing",
    category: "IT_EQUIPMENT",
    description: "Several PCs in Lab 5 fail to boot.",
    priority: "HIGH",
    status: "IN_PROGRESS",
    contactDetails: "student@smartcampus.local",
    assignedTechnicianId: ids.users.technician,
    assignedAt: now,
    resolutionNote: null,
    rejectionReason: null,
    resolvedAt: null,
    closedAt: null,
    attachments: [
      {
        attachmentId: "663100000000000000000001",
        fileName: "lab5-pc-error.jpg",
        storedFileName: "b6afdd52-6fe4-4fd3-a97f-03ae1c5ef001.jpg",
        contentType: "image/jpeg",
        fileSize: 238920,
        uploadedAt: now
      }
    ],
    comments: [
      {
        commentId: "663200000000000000000001",
        authorId: ids.users.technician,
        content: "Investigation started. Suspect power unit issue.",
        isEdited: false,
        createdAt: now,
        updatedAt: now
      }
    ],
    createdAt: now,
    updatedAt: now
  },
  {
    _id: ids.tickets.t2,
    reporterId: ids.users.student,
    resourceId: null,
    location: "Block B - Washroom 1",
    category: "PLUMBING",
    description: "Leak detected under sink near entrance.",
    priority: "MEDIUM",
    status: "OPEN",
    contactDetails: "student@smartcampus.local",
    assignedTechnicianId: null,
    assignedAt: null,
    resolutionNote: null,
    rejectionReason: null,
    resolvedAt: null,
    closedAt: null,
    attachments: [],
    comments: [],
    createdAt: now,
    updatedAt: now
  }
]);

appDb.notifications.insertMany([
  {
    _id: ObjectId("664000000000000000000001"),
    recipientId: ids.users.student,
    type: "BOOKING_APPROVED",
    title: "Booking Approved",
    message: "Your booking for Lecture Hall A has been approved.",
    isRead: false,
    referenceId: ids.bookings.b1.toHexString(),
    referenceType: "BOOKING",
    createdAt: now
  },
  {
    _id: ObjectId("664000000000000000000002"),
    recipientId: ids.users.technician,
    type: "TICKET_ASSIGNED",
    title: "Ticket Assigned",
    message: "You have been assigned a new maintenance ticket.",
    isRead: false,
    referenceId: ids.tickets.t1.toHexString(),
    referenceType: "TICKET",
    createdAt: now
  }
]);

print(`Dummy data seeding completed for database: ${dbName}`);
