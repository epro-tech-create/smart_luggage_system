# Smart Luggage Tracking, Payment and Verification System

A Spring Boot + React + PostgreSQL implementation for the Tanzanian bus-terminal luggage workflow described in the provided project PDF and slides.

## Structure

- `backend/` - Spring Boot REST API with PostgreSQL persistence.
- `frontend/` - React dashboard and passenger tracking interface.

## Backend

Create a PostgreSQL database named `smart_luggage`, then run:

```bash
cd backend
mvn spring-boot:run
```

The backend now defaults to PostgreSQL and connects to `smart_luggage_system`:

```powershell
cd backend
.\run-postgres.ps1
```

The script prompts for your PostgreSQL password and starts the API on `http://localhost:8081`.

For quick local testing without PostgreSQL, use the H2 dev profile:

```powershell
cd backend
& 'C:\Program Files\Apache\Maven\apache-maven-3.9.16\bin\mvn.cmd' spring-boot:run '-Dspring-boot.run.profiles=dev'
```

The dev profile exposes the H2 console at `http://localhost:8081/h2-console`.

Environment variables:

```bash
DB_URL=jdbc:postgresql://localhost:5432/smart_luggage_system
DB_USERNAME=postgres
DB_PASSWORD=postgres
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend defaults to `http://localhost:8081/api`. Set `VITE_API_BASE_URL=...` if your backend runs elsewhere.

When the backend is running, the frontend shows `API Live` in the header. If it shows `Demo Mode`, the UI is using local sample data because it cannot reach the API.

Frontend source structure:

- `src/main.jsx` - React mount only.
- `src/App.jsx` - app state, routing, and workflow actions.
- `src/api/` - API client and auth storage helpers.
- `src/models/` - frontend models, constants, mappers, and status formatters.
- `src/components/` - reusable layout, auth, and common UI components.
- `src/pages/` - screen-level pages for dashboard, workflows, tracking, account, admin, and reports.

## Core Features

- Smart luggage registration with sender/receiver details.
- Automated cost calculation from luggage weight.
- QR/RFID-style unique identity generation.
- Mobile money payment confirmation.
- Dispatch, stop scan, wrong-destination alert, arrival, and pickup verification flows.
- Pickup PIN verification.
- Dashboard metrics and a tracking timeline.
