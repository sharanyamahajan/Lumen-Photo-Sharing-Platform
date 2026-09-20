# LUMEN — Photo Sharing Platform

## Project Overview
LUMEN is an editorial photo-sharing platform designed for event curatorial teams and high-fashion galas. An administrator creates events and assigns team members, team members upload raw photographic plates via direct-to-S3 presigned URLs, and the admin curates and publishes client galleries. Customers access published galleries using a shareable link and a 6-digit PIN without needing an account.

## Tech Stack
- **Backend Framework**: FastAPI (Python 3.11) with Pydantic V2 for schema validation and request handling.
- **Database & ORM**: PostgreSQL with SQLAlchemy 2.0 ORM for data models and relational queries.
- **Frontend Framework**: React 19 + Vite + TailwindCSS matching the connected Stitch editorial design reference.
- **Authentication**: JWT Bearer token authentication (`PyJWT`) with password and gallery PIN hashing at rest using `bcrypt`.
- **File Storage**: AWS S3 (or S3-compatible R2/MinIO via `boto3`) with presigned upload URLs (file bytes upload directly from browser to S3).
- **Testing**: Pytest test runner with `httpx` and `starlette.testclient` for integration testing.
- **Containerization & Deployment**: Docker, Docker Compose, Uvicorn, and Nginx.

## Architecture
The frontend React application communicates with the FastAPI backend over REST API endpoints. For media ingestion, the frontend requests an S3 presigned PUT URL from the backend, uploads raw photo bytes directly to S3/R2 storage, and then confirms metadata with the backend. Authentication is handled via JWT tokens passed in the `Authorization: Bearer <token>` header for protected endpoints, while client galleries are accessed using PIN verification (`X-Gallery-PIN` header) verified against stored bcrypt hashes.

```mermaid
flowchart TD
    subgraph Client["Client Browser (React + Vite)"]
        UI["UI Screens & Controls"]
    end

    subgraph Backend["FastAPI Server (Port 8000)"]
        AUTH["Auth & JWT Middleware"]
        API["REST Routers (Auth / Events / Galleries)"]
        S3GEN["S3 Presigned URL Generator (Boto3)"]
    end

    subgraph Storage["Data & Object Storage"]
        DB[(PostgreSQL Database)]
        S3[("AWS S3 / R2 Bucket")]
    end

    UI -- 1. Authentication / JWT Login --> API
    API -- Read/Write User & Event Data --> DB
    UI -- 2. Request Presigned PUT URL --> S3GEN
    S3GEN -- Returns Presigned Upload URL --> UI
    UI -- 3. Direct Photo Upload (PUT) --> S3
    UI -- 4. Confirm Photo Metadata (POST) --> API
    API -- Save Photo Record --> DB
    UI -- 5. PIN Access (X-Gallery-PIN) --> API
```

## Database Schema

- **`users`**: User identity accounts.
  - Columns: `id` (PK, UUID String), `email` (Unique String), `password_hash` (String), `role` (`admin` or `team_member`), `created_at` (DateTime).
  - Relationships: Has many `created_events`, `event_memberships`, and uploaded `photos`.

- **`events`**: Archival events created by admins.
  - Columns: `id` (PK, String), `name` (String), `created_by` (FK -> `users.id`), `created_at` (DateTime).
  - Relationships: Belongs to `creator` (`User`), has many `members` (`EventMember`), `photos` (`Photo`), and `galleries` (`Gallery`).

- **`event_members`**: Join table controlling team member event access.
  - Columns: `id` (PK, UUID String), `event_id` (FK -> `events.id`), `user_id` (FK -> `users.id`).
  - Relationships: Belongs to `event` (`Event`) and `user` (`User`).

- **`photos`**: Photographic plate metadata.
  - Columns: `id` (PK, UUID String), `event_id` (FK -> `events.id`), `uploaded_by` (FK -> `users.id`), `filename` (String), `storage_key` (String), `file_size` (Integer bytes), `created_at` (DateTime).
  - Relationships: Belongs to `event` (`Event`), `uploader` (`User`), and has many `gallery_photos`.

- **`galleries`**: Published PIN-protected client galleries.
  - Columns: `id` (PK, UUID String), `event_id` (FK -> `events.id`), `pin_hash` (bcrypt String), `share_slug` (Unique String), `is_published` (Boolean), `published_at` (DateTime).
  - Relationships: Belongs to `event` (`Event`), has many `gallery_photos`.

- **`gallery_photos`**: Join table linking curated photos into published galleries.
  - Columns: `id` (PK, UUID String), `gallery_id` (FK -> `galleries.id`), `photo_id` (FK -> `photos.id`).
  - Relationships: Belongs to `gallery` (`Gallery`) and `photo` (`Photo`).

## Local Setup Instructions

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- Docker & Docker Compose (optional for containerized setup)

### 2. Clone and Install Steps
```bash
# Clone the repository
git clone https://github.com/sharanyamahajan/Lumen-Photo-Sharing-Platform.git
cd Lumen-Photo-Sharing-Platform

# Install Backend Dependencies
cd backend
python -m pip install -r requirements.txt
cd ..

# Install Frontend Dependencies
npm install --legacy-peer-deps
```

### 3. Environment Variables
Copy `.env.example` to `.env` in the project root and configure variables as needed.

### 4. Database Setup & Seeding
```bash
cd backend
python seed.py
```

### 5. Running the Application
```bash
# Start Backend Server (runs on http://localhost:8000)
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# In a separate terminal, start Frontend Server (runs on http://localhost:3000)
npm run dev
```

### Or Run via Docker Compose
```bash
docker-compose up --build
```

### 6. Service Ports
- **Frontend App**: `http://localhost:3000`
- **Backend API & Swagger Documentation**: `http://localhost:8000/docs`

## Environment Variables

| Variable Name | Description | Example / Placeholder |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLAlchemy PostgreSQL connection string | `postgresql://postgres:postgrespassword@localhost:5432/lumen_db` |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens | `super-secret-lumen-jwt-key-2026` |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiration time for JWT access tokens | `1440` |
| `S3_BUCKET_NAME` | AWS S3 or Cloudflare R2 bucket name | `lumen-photo-archive` |
| `AWS_ACCESS_KEY_ID` | AWS access key ID for S3 operations | `your-aws-access-key-id` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key for S3 operations | `your-aws-secret-access-key` |
| `AWS_REGION` | AWS region hosting the S3 bucket | `us-east-1` |
| `S3_ENDPOINT_URL` | Optional custom S3 / R2 endpoint URL | `https://s3.us-east-1.amazonaws.com` |
| `VITE_API_URL` | REST API base URL used by the React frontend | `http://localhost:8000/api/v1` |

## Deployment
- **Backend & Database**: Render / Railway (Dockerized FastAPI backend container connected to a managed PostgreSQL database).
- **Frontend**: Vercel / Netlify (Build command `npm run build`, output directory `dist`, pointing `VITE_API_URL` to the deployed backend URL).
- **Deployment Method**: Connected GitHub repository branch for automatic deployment on push.

## Testing
Run the full backend pytest suite:
```bash
cd backend
python -m pytest tests/ -v
```

### Test Coverage Includes:
- **`test_user_registration_and_login`**: Valid registration by admin, registration block on non-admins, valid login token generation, invalid password and non-existent email rejection.
- **`test_role_based_authorization`**: Team members blocked with `403 Forbidden` when attempting admin-only endpoints (`POST /events`, `POST /events/{id}/members`, `POST /galleries`).
- **`test_cross_event_access`**: Unassigned team members blocked with `403 Forbidden` from viewing event details, presigning photo uploads, or querying photos for events they do not belong to.
- **`test_gallery_publish_workflow_and_pin_verification`**: Admin gallery publication with 6-digit PIN and slug generation, correct PIN access, incorrect PIN rejection (`401`), and `404 Not Found` for unpublished or invalid galleries.

## Known Limitations
1. **No Server-Side Image Thumbnail Generation**: Raw photo previews use client-side rendering and high-resolution placeables rather than server-side thumbnail processing (e.g. Pillow/Sharp).
2. **In-Memory PIN Rate Limiting**: PIN verification rate limiting uses an in-memory sliding window bucket (5 attempts/min per slug). A Redis-backed rate limiter would be required for distributed multi-instance deployments.
3. **No Pagination**: Photo grid endpoints return complete arrays without cursor-based or offset-limit pagination.
4. **Mock S3 Fallback**: When AWS credentials are set to mock placeholders (`mock_access_key`), S3 presigned URLs fallback to simulated endpoints and placeables for local evaluation without requiring live AWS credentials.

## Demo Credentials
Demo account credentials and fixed gallery PINs are provided in the submission email. To populate these demo accounts and gallery records in a local or newly deployed environment, execute:
```bash
cd backend
python seed.py
```
This script creates:
- **Demo Admin Account**: `admin@lumen.ch`
- **Demo Team Member Account**: `team@lumen.ch`
- **Published Demo Gallery**: `solarium-archive` (PIN `7721`)
