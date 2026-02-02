# MockSurvey365 - Brookdale Architecture (Text-Only)

**Document Version:** 1.0  
**Date:** January 5, 2025  
**Purpose:** Text-only architecture overview for Brookdale implementation (no images or drawings)

---

## 1. High-Level System Overview

MockSurvey365 is a Node.js/Express API that supports survey workflows and AI-assisted generation.

- **Primary interface**
  - REST API under `/api/<VERSION>`
  - Real-time updates via Socket.IO (WebSocket)
- **Primary data store**
  - MongoDB (Mongoose)
- **Optional concurrency support**
  - Redis locks (used when available; system continues if Redis is unavailable)
- **Primary file/object storage**
  - AWS S3 (uploads + generated artifacts)
- **External AI/document services**
  - OpenAI API (chat + embeddings)
  - AWS Textract (OCR / tables extraction)
  - Gamma API (presentation generation)

---

## 2. Runtime Components (Repo-Derived)

### 2.1 API Server

- **Entrypoint**: `server.js` (creates HTTP server and binds Express app)
- **App definition**: `app.js` (Express setup and routing)
- **Static file serving**: `GET /public/*` served from `public/`
- **Swagger UI**: `GET /api-docs`

### 2.2 Real-time Collaboration

- **Socket server**: `socket.js`
- **Room naming convention**: `survey_<surveyId>`
- **Locking behavior**
  - Attempts Redis connection at startup
  - If Redis is unavailable, locking is skipped (single-instance or non-locking mode)

### 2.3 Databases / Storage

- **MongoDB**
  - Primary transactional datastore (Mongoose models)
  - Stores: users, orgs, surveys, residents, pathways, chunks/embeddings, generated outputs metadata
- **Redis (optional)**
  - Distributed locks for multi-instance concurrency control
- **S3**
  - Stores uploaded source documents and generated files (e.g., DOCX reports)

---

## 3. External Integrations

### 3.1 OpenAI

- Used for:
  - Chat completions for various agents
  - Embeddings for RAG workflows
- Authentication:
  - `OPENAI_API_KEY`

### 3.2 AWS Textract

- Used for:
  - OCR and table extraction when required by document workflows
- Authentication:
  - Prefer IAM roles (or access keys via env vars)

### 3.3 Gamma

- Used for:
  - Presentation generation (when enabled)

---

## 4. API Surface (Conceptual)

All routes are mounted under:

- `"/api/" + VERSION`

Primary route areas (as reflected by the repo documentation):

- **Auth & user management**
  - Login and JWT-based authentication
  - Roles/permissions
- **Survey workflow**
  - Survey creation and updates
  - Resident sample generation (initial pool, final sample)
  - Investigation generation
  - Report generation
- **Health Assistant**
  - F-tag related features
  - AskMocky365 (RAG)
  - Gamma integration

---

## 5. Primary Application Workflows (Text Data Flows)

### 5.1 Authentication Flow

- **Client → API**: `POST /api/auth/login` with `{ email, password }`
- **API → MongoDB**: Lookup user by email
- **API**:
  - Verify password (bcrypt)
  - Generate JWT (HS256)
- **API → Client**: `{ token, user }`
- **Client → API (subsequent requests)**: `Authorization: Bearer <token>`
- **API**:
  - Verifies JWT signature
  - Allows access to protected resources

### 5.2 Survey Creation + Initial Pool Generation

- **Client → API**: Create survey
- **API → MongoDB**: Persist survey metadata
- **Client → API**: Upload survey source documents (e.g., Form 802 Excel)
- **API → S3**: Store uploaded file; obtain URL
- **API → MongoDB**: Store document metadata/URL references
- **Client → API**: Request initial pool generation
- **API**:
  - Fetches source documents (typically from S3)
  - Extracts/normalizes content (may involve Textract depending on document type)
  - Calls OpenAI for structured extraction/selection steps where applicable
- **API → MongoDB**: Stores resident entries and initial pool selection state
- **API → Client**: Returns initial pool JSON results

### 5.3 Final Sample Generation

- **Client → API**: Request final sample generation
- **API → MongoDB**: Load initial pool/resident data
- **API**:
  - Applies scoring/selection strategy (agent-assisted)
  - Produces final sample set
- **API → MongoDB**: Persists final sample selection flags and metadata
- **API → Client**: Returns final sample JSON

### 5.4 Investigation Plan Generation

- **Client → API**: Request investigation plan for a survey
- **API → MongoDB**:
  - Load final sample residents
  - Load Critical Element pathways
  - Load cached pathway chunks (if present)
- **API**:
  - Downloads pathway PDFs (if needed)
  - Extracts Critical Element questions
  - Matches residents to pathways
  - Generates probe-based investigation output
- **API → MongoDB**: Save investigation plan/probes
- **API → Client**: Returns investigation plan JSON

### 5.5 Citation Report Generation (DOCX)

- **Client → API**: Request citation report generation
- **API**:
  - Uses survey + investigation data
  - Calls OpenAI for narrative generation where applicable
  - Produces a DOCX artifact
- **API → S3**: Writes DOCX file
- **API → MongoDB**: Stores metadata/links
- **API → Client**: Returns the report URL/metadata

### 5.6 Plan of Correction (POC)

- **Client → API**: Request POC generation
- **API**:
  - Reads citation report content
  - Produces structured POC components
- **API → MongoDB / S3**: Stores result (depending on implementation)
- **API → Client**: Returns structured POC JSON

### 5.7 AskMocky365 (RAG)

- **Client → API**: Ask a question
- **API**:
  - Ensures embeddings/chunks exist (may process sources on first run)
  - Retrieves relevant chunks from MongoDB
  - Calls OpenAI to generate answer from retrieved context
- **API → Client**: Returns answer + sources

---

## 6. Data Stores (Logical)

MongoDB collections commonly involved in the architecture:

- `users`
- `organizations`
- `surveys`
- `residents`
- `criticalelements`
- `pathway_chunks`
- `askmocky365_chunks`

---

## 7. Ports / Protocols (Deployment-Oriented)

- **Client → Ingress**: HTTPS 443
- **WebSockets (Socket.IO)**: WSS over 443 (requires WebSocket upgrade)
- **Ingress → Node/Express**: HTTP or HTTPS (commonly ALB terminates TLS and forwards HTTP)
- **API → MongoDB**: TLS 27017
- **API → Redis**: TCP 6379 (optional)
- **API → S3**: HTTPS 443
- **API → OpenAI**: HTTPS 443
- **API → Textract**: HTTPS 443
- **API → Gamma**: HTTPS 443

---

## 8. Required Environment Variables (Core)

From `src/constants/constants.js` (representative list):

- `PORT`
- `VERSION`
- `DB`
- `JWT_SECRET`
- `API_BASE_URL`
- `OPENAI_API_KEY` (if OpenAI used)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_KEY_ID`, `AWS_REGION`, `AWS_BUCKET_NAME` (or IAM roles)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB` (if Redis used)

---

## 9. Brookdale Open Questions / Assumptions

- **TLS termination**
  - Confirm whether TLS terminates at ALB, CloudFront, API Gateway, or NGINX.
- **MongoDB hosting model**
  - Atlas with VPC peering/private endpoint vs Brookdale-managed MongoDB.
- **Redis hosting + TLS**
  - ElastiCache Redis recommended; confirm whether Redis TLS is required.
- **AI provider governance**
  - Confirm whether Brookdale permits OpenAI, or requires Bedrock-only.
- **Secrets management**
  - Prefer AWS Secrets Manager/SSM + IAM roles (avoid static AWS keys in env vars).
