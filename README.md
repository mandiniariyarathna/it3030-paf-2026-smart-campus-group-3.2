# IT3030 PAF 2026 - Smart Campus Operations Hub

Monorepo scaffold for the Smart Campus coursework using:
- Backend: Spring Boot + MongoDB (Maven)
- Frontend: React + Vite

## Project Structure

- `backend/` - Spring Boot REST API project
- `frontend/` - React Vite application
- `docs/` - project planning and task tracking

## Prerequisites

- Java 23+
- Maven 3.9+
- Node.js 20+
- npm 10+
- MongoDB Community Server or MongoDB Atlas

## Environment Files

Copy and customize these files for local development:

- `backend/.env.example`
	- `MONGODB_URI=mongodb://localhost:27017/smartcampus_db`
	- `PORT=8080`
- `frontend/.env.example`
	- `VITE_API_BASE_URL=http://localhost:8080/api/v1`

## Run Backend

```bash
cd backend
mvn spring-boot:run
```

Backend default URL: `http://localhost:8080`

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`

## CI

CI workflow is intentionally not configured for this project.
Run checks locally when needed:
- Backend: `mvn clean test`
- Frontend: `npm run build`