# Smart Campus Project Postman Examples

Use this after importing the collection and environment files:
- Collection: [Smart-Campus-Project.postman_collection.json](Smart-Campus-Project.postman_collection.json)
- Environment: [Smart-Campus-Project.postman_environment.json](Smart-Campus-Project.postman_environment.json)

Set these variables in the environment before testing:
- `baseUrl` = `http://localhost:8085`
- `managementUrl` = `http://localhost:8080`
- `studentEmail` = `keyhasith800@gmail.com`
- `adminUsername` = `admin`
- `adminPassword` = `Admin@1234`
- `technicianEmail` = `hasith@gmail.com`
- `technicianPassword` = `12345678`
- `resourceId` = a valid resource id from your database
- `bookingId` = a valid booking id
- `ticketId` = a valid ticket id
- `commentId` = a valid comment id
- `technicianId` = a valid technician id
- `fileName` = an uploaded attachment file name

## 1. Auth

### Google Login
- Method: `POST`
- URL: `{{baseUrl}}/api/auth/google`
- Body:
```json
{
  "idToken": "YOUR_GOOGLE_ID_TOKEN"
}
```

Note: the backend does not expose separate student login or admin login endpoints. The provided student/admin values are saved as environment variables for reference, but the only auth API currently available is Google login.

### Admin Login (username/password)
- Method: `POST`
- URL: `{{baseUrl}}/api/auth/admin`
- Body:
```json
{
  "username": "{{adminUsername}}",
  "password": "{{adminPassword}}"
}
```

Note: This endpoint validates against server-side `admin` properties. Defaults are configured in the backend `application.yml` and can be changed via environment variables `ADMIN_USERNAME` and `ADMIN_PASSWORD` when running the server.

## 2. Resources

### List Resources
- Method: `GET`
- URL: `{{baseUrl}}/api/v1/resources`
- Example filters:
```text
?type=LAB&capacity=20&location=Engineering&status=ACTIVE
```

### Get Resource By Id
- Method: `GET`
- URL: `{{baseUrl}}/api/v1/resources/{{resourceId}}`

### Create Resource
- Method: `POST`
- Headers:
  - `Content-Type: application/json`
  - `X-User-Role: ADMIN`
- Body:
```json
{
  "name": "Lab A-204",
  "type": "LAB",
  "capacity": 40,
  "location": "Engineering Block A, Floor 2",
  "status": "ACTIVE",
  "description": "Computer laboratory",
  "availabilityWindows": [
    {
      "dayOfWeek": "MONDAY",
      "startTime": "08:00",
      "endTime": "16:00"
    }
  ],
  "createdBy": "admin-user-id"
}
```

### Update Resource
- Method: `PUT`
- Headers:
  - `Content-Type: application/json`
  - `X-User-Role: ADMIN`
- Body:
```json
{
  "name": "Lab A-204 Updated",
  "type": "LAB",
  "capacity": 45,
  "location": "Engineering Block A, Floor 2",
  "status": "UNDER_MAINTENANCE",
  "description": "Updated resource details",
  "availabilityWindows": [
    {
      "dayOfWeek": "WEDNESDAY",
      "startTime": "09:00",
      "endTime": "15:00"
    }
  ],
  "createdBy": "admin-user-id"
}
```

### Delete Resource
- Method: `DELETE`
- Header: `X-User-Role: ADMIN`

### Resource Availability
- Method: `GET`
- URL: `{{baseUrl}}/api/v1/resources/{{resourceId}}/availability`

## 3. Bookings

### Create Booking
- Method: `POST`
- Headers:
  - `Content-Type: application/json`
- Body example:
```json
{
  "resourceId": "{{resourceId}}",
  "date": "2026-04-28",
  "startTime": "09:00",
  "endTime": "11:00",
  "purpose": "Project meeting"
}
```

### List Bookings
- Method: `GET`
- Optional headers:
  - `X-User-Id: YOUR_USER_ID`
  - `X-User-Role: ADMIN`
- Optional query param:
```text
?status=PENDING
```

### Get Booking By Id
- Method: `GET`
- Optional headers:
  - `X-User-Id: YOUR_USER_ID`
  - `X-User-Role: ADMIN`

### Approve Booking
- Method: `PUT`
- Header: `X-User-Role: ADMIN`

### Reject Booking
- Method: `PUT`
- Headers:
  - `Content-Type: application/json`
  - `X-User-Role: ADMIN`
- Body:
```json
{
  "rejectionReason": "Schedule conflict"
}
```

### Cancel Booking
- Method: `PUT`
- Header: `X-User-Id: YOUR_USER_ID`

### Update Booking
- Method: `PUT`
- Header: `X-User-Id: YOUR_USER_ID`
- Body:
```json
{
  "resourceId": "{{resourceId}}",
  "date": "2026-04-28",
  "startTime": "10:00",
  "endTime": "12:00",
  "purpose": "Updated meeting"
}
```

### Bookings For Resource
- Method: `GET`
- URL: `{{baseUrl}}/api/v1/resources/{{resourceId}}/bookings`

## 4. Tickets

### Create Ticket
- Method: `POST`
- Header: `X-User-Id: YOUR_USER_ID`
- Body type: `form-data`
- Fields:
  - `ticket` = JSON text
  - `attachments` = file upload, optional
- Ticket JSON example:
```json
{
  "title": "Projector not working",
  "description": "The projector in room 204 does not power on.",
  "category": "EQUIPMENT",
  "priority": "HIGH"
}
```

### List Tickets
- Method: `GET`
- Optional query params:
```text
?status=OPEN&priority=HIGH&category=EQUIPMENT
```

### Update Ticket
- Method: `PUT`
- Headers:
  - `Content-Type: application/json`
- Body:
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "category": "EQUIPMENT",
  "priority": "MEDIUM"
}
```

### Update Ticket Status
- Method: `PUT`
- Header: `X-User-Role: ADMIN`
- Body:
```json
{
  "status": "IN_PROGRESS"
}
```

### Assign Technician
- Method: `PUT`
- Header: `X-User-Role: ADMIN`
- Body:
```json
{
  "technicianId": "{{technicianId}}"
}
```

### Add Comment
- Method: `POST`
- Header: `X-User-Id: YOUR_USER_ID`
- Body:
```json
{
  "message": "Please check the power cable."
}
```

### Edit Comment
- Method: `PUT`
- Header: `X-User-Id: YOUR_USER_ID`
- Body:
```json
{
  "message": "Updated comment text"
}
```

### Delete Comment
- Method: `DELETE`
- Header: `X-User-Id: YOUR_USER_ID`

### Get Ticket Attachment
- Method: `GET`
- URL: `{{baseUrl}}/uploads/tickets/{{fileName}}`

## 5. Technicians

### Technician Login
- Method: `POST`
- Body:
```json
{
  "email": "{{technicianEmail}}",
  "password": "{{technicianPassword}}"
}
```

### List Technicians
- Method: `GET`
- Optional query param:
```text
?activeOnly=true
```

### Create Technician
- Method: `POST`
- Headers:
  - `Content-Type: application/json`
- Body:
```json
{
  "name": "John Tech",
  "email": "tech@example.com",
  "password": "password123",
  "status": "ACTIVE"
}
```

### Update Technician
- Method: `PUT`
- Headers:
  - `Content-Type: application/json`
- Body:
```json
{
  "name": "John Updated",
  "email": "tech@example.com",
  "password": "password123",
  "status": "ACTIVE"
}
```

### Update Technician Status
- Method: `PUT`
- Query param:
```text
?status=ACTIVE
```

### Delete Technician
- Method: `DELETE`

## 6. Health

### Actuator Health
- Method: `GET`
- URL: `{{managementUrl}}/actuator/health`

### Actuator Info
- Method: `GET`
- URL: `{{managementUrl}}/actuator/info`

## Quick Test Order

If you want to test in the safest order:
1. `Actuator Health`
2. `Google Login`
3. `List Resources`
4. `Create Resource`
5. `Get Resource By Id`
6. `Resource Availability`
7. `Create Booking`
8. `List Bookings`
9. `Create Ticket`
10. `List Tickets`
11. `Technician Login`

If you want, I can also convert this into a single Postman-ready document with copy-paste examples for each request.