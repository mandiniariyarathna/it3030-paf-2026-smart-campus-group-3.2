# 📋 IT3030 – Smart Campus Operations Hub
## Complete Task List (Group Coursework)

> **Stack:** Spring Boot REST API + React Frontend + **MongoDB**
> **Team:** 4 Intern Developers
> **Deadline:** 27th April 2026

---

## 🗄️ MongoDB Data Models

> All collections use MongoDB's `_id` (ObjectId) as the primary identifier.
> References between documents use `ObjectId` references (stored as strings or ObjectId types).
> Embedded documents are used where data is tightly coupled and not queried independently.

---

### 📦 Collection: `users`

```json
{
  "_id": "ObjectId",
  "email": "String (unique, required)",
  "name": "String (required)",
  "picture": "String (URL, optional)",
  "role": "String (enum: USER | ADMIN | TECHNICIAN, default: USER)",
  "provider": "String (e.g. 'google')",
  "providerId": "String (Google OAuth sub ID, unique)",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Indexes:** `email` (unique), `providerId` (unique)

---

### 📦 Collection: `resources`

```json
{
  "_id": "ObjectId",
  "name": "String (required, max 100)",
  "type": "String (enum: LECTURE_HALL | LAB | MEETING_ROOM | EQUIPMENT)",
  "capacity": "Number (min: 1, required)",
  "location": "String (required, max 200)",
  "status": "String (enum: ACTIVE | OUT_OF_SERVICE | UNDER_MAINTENANCE, default: ACTIVE)",
  "description": "String (optional, max 500)",
  "availabilityWindows": [
    {
      "dayOfWeek": "String (enum: MONDAY | TUESDAY | WEDNESDAY | THURSDAY | FRIDAY | SATURDAY | SUNDAY)",
      "startTime": "String (HH:mm format, e.g. '08:00')",
      "endTime": "String (HH:mm format, e.g. '18:00')"
    }
  ],
  "createdBy": "ObjectId (ref: users)",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Indexes:** `type`, `status`, `location` (text index for search)
**Notes:** `availabilityWindows` is an embedded array — no separate collection needed.

---

### 📦 Collection: `bookings`

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: users, required)",
  "resourceId": "ObjectId (ref: resources, required)",
  "date": "String (ISO date: YYYY-MM-DD, required)",
  "startTime": "String (HH:mm, required)",
  "endTime": "String (HH:mm, required)",
  "purpose": "String (required, max 255)",
  "expectedAttendees": "Number (optional, min: 1)",
  "status": "String (enum: PENDING | APPROVED | REJECTED | CANCELLED, default: PENDING)",
  "rejectionReason": "String (optional, max 500)",
  "reviewedBy": "ObjectId (ref: users, optional)",
  "reviewedAt": "ISODate (optional)",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Indexes:** `userId`, `resourceId`, compound index on `{ resourceId, date, status }` for conflict checking
**Conflict Query:** Find documents where `resourceId` matches AND `date` matches AND `status` is `APPROVED` AND time ranges overlap.

---

### 📦 Collection: `tickets`

```json
{
  "_id": "ObjectId",
  "reporterId": "ObjectId (ref: users, required)",
  "resourceId": "ObjectId (ref: resources, optional)",
  "location": "String (required, max 200)",
  "category": "String (enum: ELECTRICAL | PLUMBING | IT_EQUIPMENT | HVAC | STRUCTURAL | OTHER)",
  "description": "String (required, max 2000)",
  "priority": "String (enum: LOW | MEDIUM | HIGH | CRITICAL)",
  "status": "String (enum: OPEN | IN_PROGRESS | RESOLVED | CLOSED | REJECTED, default: OPEN)",
  "contactDetails": "String (required, max 255)",
  "assignedTechnicianId": "ObjectId (ref: users, optional)",
  "assignedAt": "ISODate (optional)",
  "resolutionNote": "String (optional, max 2000)",
  "rejectionReason": "String (optional, max 500)",
  "resolvedAt": "ISODate (optional)",
  "closedAt": "ISODate (optional)",
  "attachments": [
    {
      "attachmentId": "String (generated ObjectId)",
      "fileName": "String (original name)",
      "storedFileName": "String (UUID-safe server name)",
      "contentType": "String (e.g. 'image/jpeg')",
      "fileSize": "Number (bytes)",
      "uploadedAt": "ISODate"
    }
  ],
  "comments": [
    {
      "commentId": "String (generated ObjectId)",
      "authorId": "ObjectId (ref: users)",
      "content": "String (required, max 1000)",
      "isEdited": "Boolean (default: false)",
      "createdAt": "ISODate",
      "updatedAt": "ISODate"
    }
  ],
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Indexes:** `reporterId`, `assignedTechnicianId`, `status`, `priority`, `category`
**Notes:** `attachments` (max 3, enforced at service layer) and `comments` are embedded arrays — no separate collections needed. Use `MongoTemplate` with `$push` / `$pull` / `$set` for array operations.

---

### 📦 Collection: `notifications`

```json
{
  "_id": "ObjectId",
  "recipientId": "ObjectId (ref: users, required)",
  "type": "String (enum: BOOKING_APPROVED | BOOKING_REJECTED | TICKET_STATUS_CHANGED | NEW_COMMENT | TICKET_ASSIGNED)",
  "title": "String (required, max 100)",
  "message": "String (required, max 500)",
  "isRead": "Boolean (default: false)",
  "referenceId": "String (ObjectId string — ID of related booking or ticket)",
  "referenceType": "String (enum: BOOKING | TICKET)",
  "createdAt": "ISODate"
}
```

**Indexes:** compound `{ recipientId, isRead }`, `createdAt` (optional TTL — auto-delete after 90 days)

---

### 📊 Collection Summary

| Collection | Embedded Sub-Documents | External References |
|---|---|---|
| `users` | None | None |
| `resources` | `availabilityWindows[]` | `users._id` (createdBy) |
| `bookings` | None | `users._id`, `resources._id` |
| `tickets` | `attachments[]`, `comments[]` | `users._id`, `resources._id` |
| `notifications` | None | `users._id` |

---

### 🔗 MongoDB vs JPA — Key Differences for the Team

| Concept | JPA / SQL (old) | MongoDB (new) |
|---|---|---|
| Primary key | `@Id Long id` (auto-increment) | `@Id String id` (ObjectId string) |
| Entity annotation | `@Entity` | `@Document(collection = "...")` |
| Repository base | `JpaRepository<T, Long>` | `MongoRepository<T, String>` |
| Embedded child | Separate table + FK | Embedded document in same collection |
| Custom queries | JPQL / HQL `@Query` | MongoDB JSON `@Query` or `MongoTemplate` |
| Array operations | N/A (join tables) | `$push`, `$pull`, `$set` via `MongoTemplate` |
| Schema migration | Flyway / Liquibase | No schema — enforce at service layer |
| Test annotation | `@DataJpaTest` | `@DataMongoTest` |

---

---

## 🗂️ Project Initialization (All Members)

### Repository & Environment Setup
- [ ] Create GitHub organisation / repo: `it3030-paf-2026-smart-campus-groupXX`
- [ ] Add all team members as collaborators
- [ ] Set up branch protection rules (`main` requires PR review)
- [ ] Define branch naming convention: `feature/<member>/<feature-name>`
- [ ] Create initial project structure:
  - [ ] `/backend` – Spring Boot project (Maven)
  - [ ] `/frontend` – React project (Vite)
- [ ] Bootstrap Spring Boot project via [start.spring.io](https://start.spring.io) with dependencies:
  - Spring Web, **Spring Data MongoDB**, Spring Security, Spring OAuth2 Client, Validation, Lombok
  - ⚠️ Do NOT add Spring Data JPA or any SQL driver
- [ ] Bootstrap React project: `npm create vite@latest frontend -- --template react`
- [ ] Install frontend dependencies: `axios`, `react-router-dom`, `tailwindcss` / `MUI`
- [ ] Configure `.gitignore` (exclude `node_modules/`, `target/`, `.env`)
- [ ] Create root-level `README.md` with setup instructions
- [ ] Decide MongoDB runtime option (no Docker):
  - [ ] Option A: Local MongoDB Community Server
  - [ ] Option B: MongoDB Atlas free cluster
- [ ] Create `.env.example` files for both backend and frontend
- [ ] Set up GitHub Actions CI workflow (`.github/workflows/ci.yml`)
  - [ ] Backend: `mvn clean test` (uses embedded MongoDB for tests)
  - [ ] Frontend: `npm run build`

### MongoDB Setup (No Docker)
- [ ] If using local MongoDB: install MongoDB Community Server and start the service
- [ ] If using Atlas: create free cluster, DB user, and IP allowlist
- [ ] Create database: `smartcampus_db`
- [ ] Configure `backend/src/main/resources/application.yml`:
  ```yaml
  spring:
    data:
      mongodb:
        uri: ${MONGODB_URI:mongodb://localhost:27017/smartcampus_db}
  ```
- [ ] Add `backend/src/main/resources/application-test.yml`:
  ```yaml
  spring:
    data:
      mongodb:
        uri: mongodb://localhost:27017/smartcampus_test
  ```
- [ ] Add backend environment variable to `.env.example`:
  - [ ] `MONGODB_URI=mongodb://localhost:27017/smartcampus_db`
- [ ] Add `@EnableMongoAuditing` to main application class
- [ ] Add Flapdoodle embedded MongoDB for tests:
  ```xml
  <dependency>
    <groupId>de.flapdoodle.embed</groupId>
    <artifactId>de.flapdoodle.embed.mongo.spring30x</artifactId>
    <scope>test</scope>
  </dependency>
  ```

---

## 👤 Developer 1 – Facilities & Assets Catalogue (Module A)

### Scenario (Read Before Implementation)
- Campus admin wants a searchable catalogue of halls, labs, rooms, and equipment.
- Students and staff need to view accurate availability windows before making bookings.
- Developer 1 must build resource CRUD, filtering, and availability APIs first, then connect frontend list/detail/form screens.

### Backend Tasks
- [ ] **D1-B01** Create `Resource` MongoDB document class:
  ```java
  @Document(collection = "resources")
  @CompoundIndex(def = "{'type': 1, 'status': 1}")
  public class Resource {
      @Id
      private String id;
      @NotBlank @Size(max = 100)
      private String name;
      private ResourceType type;
      @Min(1)
      private int capacity;
      @NotBlank @Size(max = 200)
      private String location;
      private ResourceStatus status = ResourceStatus.ACTIVE;
      @Size(max = 500)
      private String description;
      private List<AvailabilityWindow> availabilityWindows = new ArrayList<>();
      private String createdBy;       // ObjectId ref → users._id
      @CreatedDate
      private LocalDateTime createdAt;
      @LastModifiedDate
      private LocalDateTime updatedAt;
  }
  ```
- [ ] **D1-B02** Create `ResourceType` enum: `LECTURE_HALL`, `LAB`, `MEETING_ROOM`, `EQUIPMENT`
- [ ] **D1-B03** Create `ResourceStatus` enum: `ACTIVE`, `OUT_OF_SERVICE`, `UNDER_MAINTENANCE`
- [ ] **D1-B04** Create `AvailabilityWindow` embedded POJO (no `@Document`):
  ```java
  public class AvailabilityWindow {
      private DayOfWeek dayOfWeek;
      private String startTime; // "HH:mm"
      private String endTime;   // "HH:mm"
  }
  ```
- [ ] **D1-B05** Create `ResourceRepository extends MongoRepository<Resource, String>`:
  - [ ] `List<Resource> findByTypeAndStatus(ResourceType type, ResourceStatus status)`
  - [ ] `List<Resource> findByCapacityGreaterThanEqual(int capacity)`
  - [ ] `@Query("{'location': {$regex: ?0, $options: 'i'}}") List<Resource> findByLocationContaining(String location)`
- [ ] **D1-B06** Create `ResourceService` with business logic and validation
- [ ] **D1-B07** Create `ResourceController`:
  - [ ] `GET /api/v1/resources` – List all resources (filters: type, capacity, location, status)
  - [ ] `GET /api/v1/resources/{id}` – Get resource by ID
  - [ ] `POST /api/v1/resources` – Create resource (ADMIN only)
  - [ ] `PUT /api/v1/resources/{id}` – Update resource (ADMIN only)
  - [ ] `DELETE /api/v1/resources/{id}` – Soft-delete (set status OUT_OF_SERVICE, ADMIN only)
  - [ ] `GET /api/v1/resources/{id}/availability` – Get availability windows
- [ ] **D1-B08** Create `ResourceDTO`, `ResourceRequestDTO`, `ResourceResponseDTO`
- [ ] **D1-B09** Add input validation (`@Valid`, `@NotNull`, `@Size`, etc.)
- [ ] **D1-B10** Add `@EnableMongoAuditing` support for `@CreatedDate` / `@LastModifiedDate`
- [ ] **D1-B11** Write unit tests for `ResourceService` (min 5 tests)
- [ ] **D1-B12** Write integration tests for `ResourceController` using `@DataMongoTest`
- [ ] **D1-B13** Add Swagger/OpenAPI annotations to all endpoints
- [ ] **D1-B14** Seed initial data via `CommandLineRunner` bean (no `data.sql`)

### Frontend Tasks
- [ ] **D1-F01** Create `ResourcesPage` – listing with search/filter UI
- [ ] **D1-F02** Create `ResourceCard` component (type icon, status badge, capacity)
- [ ] **D1-F03** Create `ResourceDetailPage` – full resource view + availability calendar
- [ ] **D1-F04** Create `ResourceForm` (Add/Edit) – Admin-only form with validation
- [ ] **D1-F05** Create `ResourceFilter` sidebar/toolbar component
- [ ] **D1-F06** Implement `resourceService.js` API calls (axios)
- [ ] **D1-F07** Add ADMIN-only "Add Resource" and "Edit" buttons
- [ ] **D1-F08** Handle loading and error states

---

## 👤 Developer 2 – Booking Management (Module B)

### Scenario (Read Before Implementation)
- A user selects a resource and requests a time slot for an academic or event purpose.
- System must prevent overlap with already approved bookings for the same resource/date/time.
- Developer 2 must implement booking workflow rules (create, approve, reject, cancel) and expose user/admin views.

### Backend Tasks
- [ ] **D2-B01** Create `Booking` MongoDB document class:
  ```java
  @Document(collection = "bookings")
  @CompoundIndex(def = "{'resourceId': 1, 'date': 1, 'status': 1}")
  public class Booking {
      @Id
      private String id;
      @NotNull
      private String userId;             // ref → users._id
      @NotNull
      private String resourceId;         // ref → resources._id
      @NotBlank
      private String date;               // "YYYY-MM-DD"
      @NotBlank
      private String startTime;          // "HH:mm"
      @NotBlank
      private String endTime;            // "HH:mm"
      @NotBlank @Size(max = 255)
      private String purpose;
      private Integer expectedAttendees; // optional
      private BookingStatus status = BookingStatus.PENDING;
      @Size(max = 500)
      private String rejectionReason;
      private String reviewedBy;         // ref → users._id
      private LocalDateTime reviewedAt;
      @CreatedDate
      private LocalDateTime createdAt;
      @LastModifiedDate
      private LocalDateTime updatedAt;
  }
  ```
- [ ] **D2-B02** Create `BookingStatus` enum: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`
- [ ] **D2-B03** Create `BookingRepository extends MongoRepository<Booking, String>`:
  - [ ] `List<Booking> findByUserId(String userId)`
  - [ ] `List<Booking> findByStatus(BookingStatus status)`
  - [ ] Custom conflict check (use `MongoTemplate` or `@Query`):
    ```java
    @Query("{ 'resourceId': ?0, 'date': ?1, 'status': 'APPROVED', " +
           "'startTime': { $lt: ?3 }, 'endTime': { $gt: ?2 } }")
    List<Booking> findConflictingBookings(String resourceId, String date,
                                          String startTime, String endTime);
    ```
- [ ] **D2-B04** Create `BookingService`:
  - [ ] Conflict detection logic using the custom repository query
  - [ ] Status transition enforcement (PENDING → APPROVED/REJECTED, APPROVED → CANCELLED)
  - [ ] User-scoped vs Admin-scoped query logic
- [ ] **D2-B05** Create `BookingController`:
  - [ ] `POST /api/v1/bookings` – Create booking request (USER)
  - [ ] `GET /api/v1/bookings` – List bookings (Admin: all, User: own only)
  - [ ] `GET /api/v1/bookings/{id}` – Get booking detail
  - [ ] `PUT /api/v1/bookings/{id}/approve` – Approve booking (ADMIN)
  - [ ] `PUT /api/v1/bookings/{id}/reject` – Reject with reason (ADMIN)
  - [ ] `PUT /api/v1/bookings/{id}/cancel` – Cancel booking (USER/ADMIN)
  - [ ] `GET /api/v1/resources/{id}/bookings` – Get bookings for a resource (calendar view)
- [ ] **D2-B06** Create `BookingDTO`, `BookingRequestDTO`, `BookingResponseDTO`
- [ ] **D2-B07** Add date/time validation (past dates, invalid ranges)
- [ ] **D2-B08** Write unit tests for conflict detection logic (min 5 tests)
- [ ] **D2-B09** Write integration tests for booking workflow using `@DataMongoTest`
- [ ] **D2-B10** Add Swagger/OpenAPI annotations

### Frontend Tasks
- [ ] **D2-F01** Create `BookingRequestPage` – form to book a resource
- [ ] **D2-F02** Create `MyBookingsPage` – user's booking history with status badges
- [ ] **D2-F03** Create `AdminBookingsPage` – all bookings table with approve/reject actions
- [ ] **D2-F04** Create `BookingCard` component (resource, date/time, status, actions)
- [ ] **D2-F05** Create `BookingDetailModal` – full booking info + admin action buttons
- [ ] **D2-F06** Implement date/time picker with conflict preview
- [ ] **D2-F07** Implement `bookingService.js` API calls
- [ ] **D2-F08** Show conflict error messages clearly to user

---

## 👤 Developer 3 – Maintenance & Incident Ticketing (Module C)

### Scenario (Read Before Implementation)
- Students/staff report facility incidents with description, location, and optional images.
- Technicians/admins track status, assign ownership, and collaborate through ticket comments.
- Developer 3 must implement ticket lifecycle, embedded comments/attachments operations, and role-based actions.

### Backend Tasks
- [ ] **D3-B01** Create `Ticket` MongoDB document class:
  ```java
  @Document(collection = "tickets")
  public class Ticket {
      @Id
      private String id;
      @NotNull
      private String reporterId;              // ref → users._id
      private String resourceId;             // ref → resources._id (optional)
      @NotBlank @Size(max = 200)
      private String location;
      private TicketCategory category;
      @NotBlank @Size(max = 2000)
      private String description;
      private TicketPriority priority;
      private TicketStatus status = TicketStatus.OPEN;
      @NotBlank @Size(max = 255)
      private String contactDetails;
      private String assignedTechnicianId;   // ref → users._id (optional)
      private LocalDateTime assignedAt;
      @Size(max = 2000)
      private String resolutionNote;
      @Size(max = 500)
      private String rejectionReason;
      private LocalDateTime resolvedAt;
      private LocalDateTime closedAt;
      private List<TicketAttachment> attachments = new ArrayList<>(); // max 3
      private List<TicketComment> comments = new ArrayList<>();
      @CreatedDate
      private LocalDateTime createdAt;
      @LastModifiedDate
      private LocalDateTime updatedAt;
  }
  ```
- [ ] **D3-B02** Create `TicketStatus` enum: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `REJECTED`
- [ ] **D3-B03** Create `TicketPriority` enum: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- [ ] **D3-B04** Create `TicketCategory` enum: `ELECTRICAL`, `PLUMBING`, `IT_EQUIPMENT`, `HVAC`, `STRUCTURAL`, `OTHER`
- [ ] **D3-B05** Create `TicketAttachment` embedded POJO (no `@Document`):
  ```java
  public class TicketAttachment {
      private String attachmentId;      // new ObjectId().toHexString()
      private String fileName;          // original uploaded name
      private String storedFileName;    // UUID.randomUUID() + extension
      private String contentType;       // "image/jpeg" | "image/png"
      private long fileSize;            // bytes
      private LocalDateTime uploadedAt;
  }
  ```
- [ ] **D3-B06** Create `TicketComment` embedded POJO (no `@Document`):
  ```java
  public class TicketComment {
      private String commentId;     // new ObjectId().toHexString()
      private String authorId;      // ref → users._id
      private String content;       // max 1000
      private boolean isEdited = false;
      private LocalDateTime createdAt;
      private LocalDateTime updatedAt;
  }
  ```
- [ ] **D3-B07** Create `TicketRepository extends MongoRepository<Ticket, String>`:
  - [ ] `List<Ticket> findByReporterId(String reporterId)`
  - [ ] `List<Ticket> findByAssignedTechnicianId(String technicianId)`
  - [ ] `List<Ticket> findByStatusAndPriority(TicketStatus status, TicketPriority priority)`
  - [ ] No separate comment/attachment repositories — use `MongoTemplate` for embedded ops
- [ ] **D3-B08** Create `TicketService`:
  - [ ] Ticket status workflow enforcement
  - [ ] Attachment upload: check `ticket.getAttachments().size() < 3` before adding
  - [ ] Add comment: `mongoTemplate.updateFirst(query, new Update().push("comments", comment), Ticket.class)`
  - [ ] Edit comment: `mongoTemplate.updateFirst(query, new Update().set("comments.$.content", ...).set("comments.$.isEdited", true), Ticket.class)` using positional `$` operator
  - [ ] Delete comment: `mongoTemplate.updateFirst(query, new Update().pull("comments", query(where("commentId").is(commentId))), Ticket.class)`
  - [ ] Comment ownership rules (edit/delete own; Admin deletes any)
  - [ ] Technician assignment logic
- [ ] **D3-B09** Create `TicketController`:
  - [ ] `POST /api/v1/tickets` – Create ticket with attachments (USER)
  - [ ] `GET /api/v1/tickets` – List tickets (User: own; Admin/Tech: all, with filters)
  - [ ] `GET /api/v1/tickets/{id}` – Get ticket detail
  - [ ] `PUT /api/v1/tickets/{id}/status` – Update status (ADMIN/TECHNICIAN)
  - [ ] `PUT /api/v1/tickets/{id}/assign` – Assign technician (ADMIN)
  - [ ] `DELETE /api/v1/tickets/{id}` – Admin soft-delete (set status CLOSED)
- [ ] **D3-B10** Create `TicketCommentController`:
  - [ ] `POST /api/v1/tickets/{id}/comments` – Add comment (push to embedded array)
  - [ ] `PUT /api/v1/tickets/{id}/comments/{commentId}` – Edit own comment
  - [ ] `DELETE /api/v1/tickets/{id}/comments/{commentId}` – Delete comment (owner/Admin)
- [ ] **D3-B11** Implement file upload with `MultipartFile` + local storage (safe file handling)
- [ ] **D3-B12** Write unit tests for `TicketService` (min 5 tests)
- [ ] **D3-B13** Write integration tests for ticket workflow using `@DataMongoTest`
- [ ] **D3-B14** Add Swagger/OpenAPI annotations

### Frontend Tasks
- [ ] **D3-F01** Create `CreateTicketPage` – form with category, priority, description, image upload (max 3)
- [ ] **D3-F02** Create `MyTicketsPage` – user's tickets list
- [ ] **D3-F03** Create `AdminTicketsPage` – all tickets with filters and assignment UI
- [ ] **D3-F04** Create `TicketDetailPage` – full ticket view, status timeline, comments, attachments
- [ ] **D3-F05** Create `CommentSection` component with edit/delete actions
- [ ] **D3-F06** Create `ImageUploadPreview` component (drag-and-drop, max 3 images)
- [ ] **D3-F07** Create `TicketStatusBadge` and `PriorityBadge` components
- [ ] **D3-F08** Implement `ticketService.js` API calls

---

## 👤 Developer 4 – Notifications, Auth & Roles (Modules D & E)

### Scenario (Read Before Implementation)
- Users authenticate with Google, receive role-based access, and are notified when booking/ticket events occur.
- Admins must manage user roles and ensure protected endpoints are enforced consistently.
- Developer 4 must implement MongoDB-backed auth/user models, JWT security, and notification delivery APIs.

### Backend Tasks
- [ ] **D4-B01** Create `Notification` MongoDB document class:
  ```java
  @Document(collection = "notifications")
  public class Notification {
      @Id
      private String id;
      @NotNull
      private String recipientId;          // ref → users._id
      private NotificationType type;
      @NotBlank @Size(max = 100)
      private String title;
      @NotBlank @Size(max = 500)
      private String message;
      private boolean isRead = false;
      private String referenceId;          // ObjectId string of booking or ticket
      private String referenceType;        // "BOOKING" | "TICKET"
      @CreatedDate
      private LocalDateTime createdAt;
  }
  ```
- [ ] **D4-B02** Create `NotificationType` enum: `BOOKING_APPROVED`, `BOOKING_REJECTED`, `TICKET_STATUS_CHANGED`, `NEW_COMMENT`, `TICKET_ASSIGNED`
- [ ] **D4-B03** Create `NotificationRepository extends MongoRepository<Notification, String>`:
  - [ ] `List<Notification> findByRecipientIdOrderByCreatedAtDesc(String recipientId)`
  - [ ] `long countByRecipientIdAndIsReadFalse(String recipientId)`
  - [ ] `List<Notification> findByRecipientIdAndIsRead(String recipientId, boolean isRead)`
- [ ] **D4-B04** Create `NotificationService` – create, fetch, mark-as-read, delete logic
- [ ] **D4-B05** Create `NotificationController`:
  - [ ] `GET /api/v1/notifications` – Get user's notifications (paginated)
  - [ ] `PUT /api/v1/notifications/{id}/read` – Mark single notification as read
  - [ ] `PUT /api/v1/notifications/read-all` – Mark all as read
  - [ ] `DELETE /api/v1/notifications/{id}` – Delete notification
- [ ] **D4-B06** Integrate notification triggers in `BookingService` and `TicketService`
- [ ] **D4-B07** Create `User` MongoDB document class:
  ```java
  @Document(collection = "users")
  public class User {
      @Id
      private String id;
      @Indexed(unique = true)
      @NotBlank
      private String email;
      @NotBlank
      private String name;
      private String picture;              // optional
      private Role role = Role.USER;
      private String provider;             // "google"
      @Indexed(unique = true)
      private String providerId;           // Google sub ID
      @CreatedDate
      private LocalDateTime createdAt;
      @LastModifiedDate
      private LocalDateTime updatedAt;
  }
  ```
- [ ] **D4-B08** Create `Role` enum: `USER`, `ADMIN`, `TECHNICIAN`
- [ ] **D4-B09** Create `UserRepository extends MongoRepository<User, String>`:
  - [ ] `Optional<User> findByEmail(String email)`
  - [ ] `Optional<User> findByProviderId(String providerId)`
  - [ ] `List<User> findByRole(Role role)`
- [ ] **D4-B10** Configure Spring Security:
  - [ ] OAuth 2.0 (Google) login
  - [ ] JWT token issuance post OAuth2 success (store `userId`, `email`, `role` in claims)
  - [ ] `JwtAuthenticationFilter`
  - [ ] `SecurityConfig` with role-based endpoint protection
  - [ ] Use `UserRepository` (MongoDB) to load user — no JPA `UserDetailsService`
- [ ] **D4-B11** Create `AuthController`:
  - [ ] `GET /api/v1/auth/me` – Get current user profile
  - [ ] `POST /api/v1/auth/logout` – Invalidate session/token
- [ ] **D4-B12** Create `UserController` (Admin):
  - [ ] `GET /api/v1/users` – List all users (ADMIN)
  - [ ] `PUT /api/v1/users/{id}/role` – Change user role (ADMIN)
- [ ] **D4-B13** Implement global exception handler (`@ControllerAdvice`)
- [ ] **D4-B14** Implement CORS configuration
- [ ] **D4-B15** Write unit tests for `AuthService` and `NotificationService` (min 5 tests)
- [ ] **D4-B16** Write integration tests for auth flows using `@DataMongoTest`

### Frontend Tasks
- [ ] **D4-F01** Implement Google OAuth login page/button
- [ ] **D4-F02** Implement JWT storage and axios interceptor for auth headers
- [ ] **D4-F03** Create `AuthContext` / Redux auth slice for global user state
- [ ] **D4-F04** Implement protected route HOC (`<PrivateRoute>`, `<AdminRoute>`)
- [ ] **D4-F05** Create `NotificationBell` component in navbar (unread count badge)
- [ ] **D4-F06** Create `NotificationPanel` drawer/dropdown (list, mark-read, clear)
- [ ] **D4-F07** Create `UserManagementPage` – Admin: list users, change roles
- [ ] **D4-F08** Implement `notificationService.js` and `authService.js` API calls
- [ ] **D4-F09** Implement auto-logout on token expiry (axios response interceptor)

---

## 🔧 Shared / Cross-Cutting Tasks (All Members)

### MongoDB Database
- [ ] Agree on final collection schemas — share this task list document with team
- [ ] Add `@EnableMongoAuditing` to main `@SpringBootApplication` class
- [ ] Create indexes via `@Indexed`, `@CompoundIndex`, or `MongoTemplate` in a config class
- [ ] ~~No Flyway / Liquibase needed~~ — enforce schema at service/validation layer
- [ ] Create `DataSeeder implements CommandLineRunner` for initial test data (replaces `data.sql`)
- [ ] All IDs are `String` type in Java (MongoDB ObjectId serialised as hex string)
- [ ] Confirm `spring.data.mongodb.uri` in `application.yml` for both `main` and `test` profiles

### API Design (Shared)
- [ ] Agree on common API response wrapper: `{ "success": bool, "data": ..., "message": "..." }`
- [ ] Agree on error response format: `{ "error": "...", "details": {...} }`
- [ ] All entity IDs in JSON responses are **strings** (MongoDB ObjectId as hex)
- [ ] Configure SpringDoc OpenAPI (Swagger UI at `/swagger-ui.html`)

### Testing & Quality
- [ ] Each member writes min. 5 unit tests for their service layer
- [ ] Use `@DataMongoTest` with Flapdoodle Embedded MongoDB for repository tests (no Docker needed in CI)
- [ ] Each member creates Postman collection for their endpoints
- [ ] Combine Postman collections into one exported file for submission
- [ ] Run full test suite before each PR merge

### CI/CD
- [ ] GitHub Actions: build + test on every push to `main` and on PRs
- [ ] Embedded MongoDB handles DB in CI — no external service needed
- [ ] Add test coverage report (JaCoCo)

### Documentation
- [ ] Each member documents their endpoints in the shared API doc
- [ ] Final Report: SRS, Architecture Diagrams, Endpoint List, Testing Evidence, Contribution Summary
- [ ] Screenshots of key workflows + MongoDB Compass collection views

---

## 📅 Suggested Timeline

| Week | Dates | Milestones |
|------|-------|------------|
| Week 1 | 24–30 Mar | Repo setup, MongoDB local/Atlas setup, `@Document` models agreed, auth skeleton |
| Week 2 | 31 Mar–6 Apr | Module A & B core APIs + basic React pages |
| Week 3 | 7–13 Apr | Module C & D APIs + embedded array operations + frontend integration |
| Week 4 | 14–20 Apr | Notifications, role-based UI, `MongoTemplate` operations |
| Week 5 | 21–25 Apr | Bug fixes, documentation, Postman collections |
| Submission | 27 Apr | Final submission via Courseweb by 11:45 PM |

---

## 📁 Submission Checklist

- [ ] GitHub repo public & accessible (`it3030-paf-2026-smart-campus-groupXX`)
- [ ] `README.md` with clear setup instructions for local MongoDB or MongoDB Atlas
- [ ] GitHub Actions CI passing (green badge — embedded MongoDB used in tests)
- [ ] All minimum module requirements implemented
- [ ] Report PDF: `IT3030_PAF_Assignment_2026_GroupXX.pdf`
- [ ] Postman collection exported
- [ ] Screenshots / video of key workflows + MongoDB collection views (MongoDB Compass)
- [ ] Individual contribution clearly documented in report

---

*Last updated: April 2026 — Database changed from MySQL/PostgreSQL to MongoDB (Spring Data MongoDB)*
