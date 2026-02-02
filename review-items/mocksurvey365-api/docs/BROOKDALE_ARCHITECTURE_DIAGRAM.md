# MockSurvey365 - Brookdale Architecture & Data Flow Diagram

**Document Version:** 1.0  
**Date:** January 5, 2025  
**Purpose:** Technical architecture for Brookdale implementation

---

## Proposed Implementation (Repo-Derived) - Architecture, Data Flows, Ports/Protocols

This section summarizes the **current MockSurvey365 API implementation** as represented in this repository (Node/Express + MongoDB + optional Redis locks + external AI/document services), and maps it into a Brookdale deployment view.

### Key Runtime Components (from repository)

#### API Server

- **Entrypoint:** `server.js` (Node `http.createServer(app)`)
- **App:** `app.js` (Express routes under `/api/${VERSION}`)
- **Static file serving:** `GET /public/*` (served from `public/`)
- **Swagger UI:** `GET /api-docs`

#### Real-time Collaboration (Socket.IO)

- **Socket server:** `socket.js`
- **Room pattern:** `survey_<surveyId>`
- **Redis lock support:** attempts to connect at startup; if unavailable, locks are skipped.

#### Databases / Storage

- **MongoDB:** main transactional datastore (Mongoose)
- **Redis:** optional distributed locks for concurrency (especially multi-instance deployments)
- **S3:** document storage (uploads + generated artifacts), via AWS SDK

### Primary Application Data Flows

#### Survey Lifecycle (Representative Endpoints)

All routes are mounted under `"/api/" + VERSION`.

- **Survey creation & updates:**
- **AI-powered generation:**
- **Health Assistant (F-tags / RAG / Gamma):**

### Software Bill of Materials (Selected Versions)

The following versions are pulled directly from `package.json`:

| Component | Version |
|---|---:|
| Node.js | 18.x LTS (deployment policy) |
| Express | 4.21.1 |
| Socket.IO | 4.7.5 |
| MongoDB driver | 6.20.0 |
| Mongoose | 8.4.4 |
| Redis client | 5.10.0 |
| OpenAI SDK | 5.23.0 |
| LangChain | 0.3.34 |
| Swagger JSDoc | 6.2.8 |
| Swagger UI Express | 4.6.3 |
| Helmet | 7.1.0 |

### Ports / Protocols Matrix (Brookdale)

| Flow | Source | Destination | Protocol | Port(s) | Notes |
|---|---|---|---|---:|---|
| End-user API access | Browser | ALB/Ingress | HTTPS | 443 | TLS 1.2+ |
| WebSockets (Socket.IO) | Browser | ALB/Ingress | WSS/HTTPS | 443 | Requires WS upgrade headers allowed |
| Ingress to API | ALB | Node/Express | HTTP or HTTPS | 80/443 or app port | Common pattern: ALB terminates TLS and forwards HTTP |
| MongoDB access | API | MongoDB Atlas/Managed MongoDB | TLS | 27017 | Connection string via `process.env.DB` |
| Redis locks | API | Redis | TCP (optional TLS) | 6379 | Host/port via `REDIS_HOST`, `REDIS_PORT` |
| Object storage | API | AWS S3 | HTTPS | 443 | Signed URLs/IAM role-based access |
| AI model calls | API | OpenAI / Bedrock | HTTPS | 443 | API key (OpenAI) or IAM (Bedrock) |
| OCR/extraction | API | AWS Textract | HTTPS | 443 | IAM-based |

### Required Environment Variables (from `src/constants/constants.js`)

- `PORT` (API listen port)
- `VERSION` (API route prefix)
- `DB` (MongoDB connection string)
- `JWT_SECRET`
- `API_BASE_URL`
- `OPENAI_API_KEY` (if OpenAI used)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_KEY_ID`, `AWS_REGION`, `AWS_BUCKET_NAME` (or preferably IAM roles)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB` (if Redis used)

### Brookdale Open Questions / Assumptions (to finalize the deployment diagram)

1. **TLS termination**
   - Confirm whether TLS terminates at ALB, CloudFront, API Gateway, or NGINX.
2. **MongoDB hosting model**
   - MongoDB Atlas with VPC peering/private endpoint vs Brookdale-managed MongoDB.
3. **Redis hosting + TLS**
   - ElastiCache Redis recommended; confirm whether Redis TLS is required.
4. **AI provider governance**
   - Confirm whether Brookdale permits OpenAI, or requires Bedrock-only.
5. **Secrets management**
   - Recommend AWS Secrets Manager/SSM + IAM roles (avoid static AWS keys in env vars).

---

## System Architecture Overview

```mermaid
flowchart TB
  %% High-level Brookdale deployment view (repo-derived)
  U[Brookdale Users\n(Survey Coordinators, Surveyors, Admins)]

  subgraph AWS[AWS / Cloud Infrastructure]
    CF[CloudFront CDN\n(HTTPS 443)]
    ALB[Application Load Balancer\n(HTTPS 443 / WSS 443)]
    ASG[Compute (EC2 ASG / Container Runtime)\nNode.js + Express + Socket.IO\nApp Port 3000]
    S3[(S3 Bucket\nDocuments + Generated Artifacts)]
    TEX[AWS Textract\n(TABLES extraction)]
    REDIS[(Redis (optional)\nDistributed locks)]
  end

  subgraph DB[Data Layer]
    MONGO[(MongoDB Atlas / Managed MongoDB\nTLS 27017)]
  end

  subgraph EXT[External APIs]
    OAI[OpenAI API\n(Chat + Embeddings)]
    GAMMA[Gamma API\n(Presentation generation)]
  end

  %% Ingress
  U -->|HTTPS 443| CF
  CF -->|HTTPS 443| ALB
  ALB -->|HTTP 3000| ASG

  %% Realtime
  U -.->|WSS 443| ALB
  ALB -.->|WebSocket upgrade| ASG
  ASG -.->|Locking (optional)| REDIS

  %% Core dependencies
  ASG -->|CRUD + app state| MONGO
  ASG -->|Upload/Download (HTTPS 443)| S3
  ASG -->|Start + Poll jobs| TEX
  ASG -->|LLM + embeddings (HTTPS 443)| OAI
  ASG -->|Generate + fetch| GAMMA

  %% API surface (repo routing)
  subgraph API[Express API Routes\nPrefix: /api/<VERSION>]
    AUTH[Auth\n/admin, /user, /usermanagement]
    SURVEY[Survey Workflow\n/surveyMain + /surveybuilder]
    HA[Health Assistant\n/health-assistant]
  end

  ASG --> API

  %% Key survey workflow
  SURVEY --> IP[Initial Pool Agent\nTextract + selection]
  IP --> FS[Final Sample Agent\nScoring + selection]
  FS --> INV[Investigation Agent\nPathway matching + probes]
  INV --> CR[Citation Report Generator\nDOCX output]
  CR --> POC[Plan Of Correction Generator]

  %% Health assistant capabilities
  HA --> FTAG[F-tag prediction\n/predictAgent]
  HA --> RAG[AskMocky365 (RAG)\n/askMocky365]
  HA --> G[Gamma integration\n/gamma]

  %% Storage + caches
  IP -->|reads docs| S3
  CR -->|writes report| S3
  RAG -->|vector chunks| MONGO
  INV -->|pathway chunks| MONGO
```

---

## Detailed Component Architecture

### 1. Frontend Layer (Client-Side)

```
┌─────────────────────────────────────────────────────────────┐
│                    WEB BROWSER (Client)                      │
│                                                               │
│  Technology Stack:                                            │
│  - React.js (v18.x)                                          │
│  - JavaScript/TypeScript                                     │
│  - HTTPS only (Port 443)                                     │
│                                                               │
│  Communication:                                               │
│  - REST API calls (HTTPS/JSON)                               │
│  - WebSocket (WSS) for real-time updates                     │
│  - File uploads (multipart/form-data)                        │
└─────────────────────────────────────────────────────────────┘
```

### 2. Application Layer (Backend)

```
┌─────────────────────────────────────────────────────────────┐
│              NODE.JS APPLICATION SERVER                      │
│                                                               │
│  Technology:                                                  │
│  - Node.js v18.x LTS                                         │
│  - Express.js v4.x                                           │
│  - Port: 3000 (internal)                                     │
│                                                               │
│  Key Components:                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  API Routes (/api/*)                                 │    │
│  │  - /api/auth (Authentication)                        │    │
│  │  - /api/surveys (Survey management)                  │    │
│  │  - /api/healthAssistant (AI agents)                  │    │
│  │  - /api/users (User management)                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Middleware                                           │    │
│  │  - Authentication (JWT verification)                 │    │
│  │  - Authorization (RBAC)                              │    │
│  │  - Rate limiting                                     │    │
│  │  - Input validation                                  │    │
│  │  - Error handling                                    │    │
│  │  - Logging                                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  AI Agents (Helpers)                                 │    │
│  │  - extractResidentData                               │    │
│  │  - finalSampleAgent                                  │    │
│  │  - investigationAgent                                │    │
│  │  - citationReportAgent                               │    │
│  │  - planOfCorrectionAgent                             │    │
│  │  - askMocky365Agent                                  │    │
│  │  - predictAgent                                      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 3. Database Layer

```
┌─────────────────────────────────────────────────────────────┐
│                    MONGODB ATLAS                             │
│                                                               │
│  Version: MongoDB 7.x                                        │
│  Port: 27017 (TLS encrypted)                                 │
│  Protocol: MongoDB Wire Protocol                             │
│                                                               │
│  Collections:                                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  users                                               │    │
│  │  - User accounts, roles, permissions                │    │
│  │  - Indexes: email, organizationId                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  organizations                                       │    │
│  │  - Brookdale facilities/communities                 │    │
│  │  - Hierarchical structure                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  surveys                                             │    │
│  │  - Survey metadata, status, timeline                │    │
│  │  - Indexes: organizationId, userId, status          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  residents                                           │    │
│  │  - Resident data, patient needs, selections         │    │
│  │  - Indexes: surveyId, selectedForSample             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  criticalelements                                    │    │
│  │  - Critical Element pathways (PDFs)                 │    │
│  │  - Indexes: userId, type, status                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  pathway_chunks                                      │    │
│  │  - Processed pathway embeddings for AI              │    │
│  │  - Vector embeddings (1536 dimensions)              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  askmocky365_chunks                                  │    │
│  │  - F-tag reference embeddings                       │    │
│  │  - Vector embeddings for RAG                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  Security:                                                    │
│  - Encryption at rest: AES-256                              │
│  - Encryption in transit: TLS 1.2+                          │
│  - IP whitelisting                                          │
│  - Database authentication (username/password)              │
│  - Role-based access control                                │
└─────────────────────────────────────────────────────────────┘
```

### 4. External Services Integration

```
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                           │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  OpenAI API (api.openai.com)                        │    │
│  │  - Port: 443 (HTTPS)                                │    │
│  │  - Protocol: REST API (JSON)                        │    │
│  │  - Models: GPT-4o, GPT-4o-mini, GPT-4-turbo        │    │
│  │  - Authentication: API Key (Bearer token)           │    │
│  │  - Rate limits: Tier-based                          │    │
│  │  - Data: NOT used for training                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  AWS S3 (s3.amazonaws.com)                          │    │
│  │  - Port: 443 (HTTPS)                                │    │
│  │  - Protocol: AWS S3 API                             │    │
│  │  - Purpose: Document storage (PDFs, Excel files)    │    │
│  │  - Bucket: mocksurvey.s3.amazonaws.com              │    │
│  │  - Encryption: AES-256 (server-side)                │    │
│  │  - Access: IAM roles, signed URLs                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Email Service (SMTP/SES)                           │    │
│  │  - Port: 587 (TLS) or 465 (SSL)                     │    │
│  │  - Protocol: SMTP                                   │    │
│  │  - Purpose: Notifications, alerts, reports          │    │
│  │  - AWS SES or third-party SMTP                      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Data Flow 1: User Authentication

```
┌─────────┐                                    ┌─────────────┐
│ Browser │                                    │   Node.js   │
│         │                                    │   Server    │
└────┬────┘                                    └──────┬──────┘
     │                                                │
     │  1. POST /api/auth/login                      │
     │    { email, password }                        │
     │────────────────────────────────────────────>  │
     │    HTTPS (Port 443)                           │
     │                                                │
     │                                                │  2. Query user
     │                                                │     by email
     │                                                │─────────────┐
     │                                                │             │
     │                                    ┌───────────▼──────────┐  │
     │                                    │   MongoDB Atlas      │  │
     │                                    │   Port: 27017 (TLS)  │  │
     │                                    │   users collection   │  │
     │                                    └───────────┬──────────┘  │
     │                                                │             │
     │                                                │  3. Return  │
     │                                                │     user    │
     │                                                │<────────────┘
     │                                                │
     │                                                │  4. Verify password
     │                                                │     (bcrypt)
     │                                                │
     │                                                │  5. Generate JWT
     │                                                │     (HS256)
     │                                                │
     │  6. Response: { token, user }                 │
     │  <────────────────────────────────────────────│
     │                                                │
     │  7. Store token (localStorage)                │
     │                                                │
     │  8. Subsequent requests:                      │
     │     Authorization: Bearer <token>             │
     │────────────────────────────────────────────>  │
     │                                                │
     │                                                │  9. Verify JWT
     │                                                │     signature
     │                                                │
     │  10. Protected resource                       │
     │  <────────────────────────────────────────────│
     │                                                │
```

### Data Flow 2: Survey Creation & Resident Sample Generation

```
┌─────────┐         ┌─────────────┐         ┌──────────┐         ┌─────────┐
│ Browser │         │   Node.js   │         │ MongoDB  │         │ OpenAI  │
│         │         │   Server    │         │  Atlas   │         │   API   │
└────┬────┘         └──────┬──────┘         └────┬─────┘         └────┬────┘
     │                     │                     │                     │
     │ 1. Create Survey    │                     │                     │
     │──────────────────>  │                     │                     │
     │                     │  2. Save survey     │                     │
     │                     │──────────────────>  │                     │
     │                     │                     │                     │
     │                     │  3. Survey ID       │                     │
     │                     │<──────────────────  │                     │
     │                     │                     │                     │
     │ 4. Upload Form 802  │                     │                     │
     │    (Excel file)     │                     │                     │
     │──────────────────>  │                     │                     │
     │                     │                     │                     │
     │                     │  5. Upload to S3    │                     │
     │                     │─────────────────────────────────────────> │
     │                     │    (AWS S3 API)                           │
     │                     │                     │                     │
     │                     │  6. S3 URL          │                     │
     │                     │<───────────────────────────────────────── │
     │                     │                     │                     │
     │                     │  7. Save doc URL    │                     │
     │                     │──────────────────>  │                     │
     │                     │                     │                     │
     │ 8. Generate Initial │                     │                     │
     │    Pool             │                     │                     │
     │──────────────────>  │                     │                     │
     │                     │                     │                     │
     │                     │  9. Download Excel  │                     │
     │                     │     from S3         │                     │
     │                     │─────────────────────────────────────────> │
     │                     │                     │                     │
     │                     │  10. Parse Excel    │                     │
     │                     │      (XLSX library) │                     │
     │                     │                     │                     │
     │                     │  11. Extract text   │                     │
     │                     │      Send to OpenAI │                     │
     │                     │──────────────────────────────────────────>│
     │                     │      POST /v1/chat/completions            │
     │                     │      (Port 443, HTTPS)                    │
     │                     │                     │                     │
     │                     │  12. AI extracts    │                     │
     │                     │      resident data  │                     │
     │                     │<──────────────────────────────────────────│
     │                     │                     │                     │
     │                     │  13. Save residents │                     │
     │                     │──────────────────>  │                     │
     │                     │                     │                     │
     │ 14. Initial pool    │                     │                     │
     │     (JSON response) │                     │                     │
     │<──────────────────  │                     │                     │
     │                     │                     │                     │
```

### Data Flow 3: Investigation Plan Generation

```
┌─────────┐    ┌─────────────┐    ┌──────────┐    ┌─────────┐    ┌──────┐
│ Browser │    │   Node.js   │    │ MongoDB  │    │ OpenAI  │    │  S3  │
│         │    │   Server    │    │  Atlas   │    │   API   │    │      │
└────┬────┘    └──────┬──────┘    └────┬─────┘    └────┬────┘    └───┬──┘
     │                │                 │                │             │
     │ 1. Generate    │                 │                │             │
     │    Investigation│                │                │             │
     │────────────────>│                │                │             │
     │                │                 │                │             │
     │                │  2. Get final   │                │             │
     │                │     sample      │                │             │
     │                │────────────────>│                │             │
     │                │                 │                │             │
     │                │  3. Residents   │                │             │
     │                │<────────────────│                │             │
     │                │                 │                │             │
     │                │  4. Get pathways│                │             │
     │                │────────────────>│                │             │
     │                │                 │                │             │
     │                │  5. Pathways    │                │             │
     │                │<────────────────│                │             │
     │                │                 │                │             │
     │                │  6. Download    │                │             │
     │                │     pathway PDFs│                │             │
     │                │─────────────────────────────────────────────> │
     │                │                 │                │             │
     │                │  7. PDF content │                │             │
     │                │<───────────────────────────────────────────── │
     │                │                 │                │             │
     │                │  8. Extract CE  │                │             │
     │                │     questions   │                │             │
     │                │     (pdf-parse) │                │             │
     │                │                 │                │             │
     │                │  9. Match       │                │             │
     │                │     residents to│                │             │
     │                │     pathways    │                │             │
     │                │─────────────────────────────────>│             │
     │                │     (OpenAI API)│                │             │
     │                │                 │                │             │
     │                │  10. Matched    │                │             │
     │                │      pathways   │                │             │
     │                │<─────────────────────────────────│             │
     │                │                 │                │             │
     │                │  11. Generate   │                │             │
     │                │      probes     │                │             │
     │                │─────────────────────────────────>│             │
     │                │                 │                │             │
     │                │  12. Investigation│              │             │
     │                │      probes     │                │             │
     │                │<─────────────────────────────────│             │
     │                │                 │                │             │
     │                │  13. Save       │                │             │
     │                │      investigation│              │             │
     │                │────────────────>│                │             │
     │                │                 │                │             │
     │ 14. Investigation│               │                │             │
     │     plan (JSON) │                │                │             │
     │<────────────────│                │                │             │
     │                │                 │                │             │
```

---

## Network Ports and Protocols

### Inbound Traffic

| Port | Protocol | Service | Purpose | Encryption |
|------|----------|---------|---------|------------|
| 443 | HTTPS | CloudFront/ALB | Web application access | TLS 1.2+ |
| 443 | HTTPS | API Gateway | REST API calls | TLS 1.2+ |
| 443 | WSS | WebSocket | Real-time updates | TLS 1.2+ |

### Outbound Traffic

| Port | Protocol | Service | Purpose | Encryption |
|------|----------|---------|---------|------------|
| 443 | HTTPS | OpenAI API | AI model requests | TLS 1.2+ |
| 443 | HTTPS | AWS S3 | File storage/retrieval | TLS 1.2+ |
| 27017 | MongoDB | MongoDB Atlas | Database connections | TLS 1.2+ |
| 587 | SMTP/TLS | Email Service | Email notifications | TLS |
| 443 | HTTPS | AWS Services | CloudWatch, Secrets Manager | TLS 1.2+ |

### Internal Traffic (AWS VPC)

| Port | Protocol | Service | Purpose | Encryption |
|------|----------|---------|---------|------------|
| 3000 | HTTP | Node.js App | ALB to EC2 instances | Internal VPC |
| 22 | SSH | EC2 Management | Administrative access | SSH keys |

---

## Software Versions

### Application Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18.x LTS | Runtime environment |
| Express.js | 4.x | Web framework |
| MongoDB | 7.x | Database |
| Mongoose | 8.x | ODM for MongoDB |
| React.js | 18.x | Frontend framework |
| JWT | jsonwebtoken 9.x | Authentication |
| Bcrypt | 5.x | Password hashing |
| Axios | 1.x | HTTP client |
| pdf-parse | 1.x | PDF processing |
| xlsx | 0.18.x | Excel processing |

### AWS Services

| Service | Purpose |
|---------|---------|
| EC2 | Application servers |
| ALB | Load balancing |
| CloudFront | CDN |
| S3 | File storage |
| CloudWatch | Monitoring & logging |
| GuardDuty | Threat detection |
| WAF | Web application firewall |
| Secrets Manager | Credential management |
| Certificate Manager | SSL/TLS certificates |
| Route 53 | DNS management |

### Third-Party Services

| Service | Version/API | Purpose |
|---------|-------------|---------|
| OpenAI API | v1 | AI/LLM processing |
| MongoDB Atlas | 7.x | Managed database |
| Snyk | Latest | Dependency scanning |
| GitHub Actions | Latest | CI/CD pipeline |

---

## Security Architecture

### Encryption

```
┌─────────────────────────────────────────────────────────────┐
│                    ENCRYPTION LAYERS                         │
│                                                               │
│  1. Transport Layer (TLS 1.2+)                               │
│     - All external communications                            │
│     - Certificate: AWS Certificate Manager                   │
│     - Cipher suites: Modern, secure only                     │
│                                                               │
│  2. Application Layer                                        │
│     - JWT tokens (HS256 algorithm)                           │
│     - Password hashing (bcrypt, cost factor 10)              │
│     - API key encryption in Secrets Manager                  │
│                                                               │
│  3. Data Layer (AES-256)                                     │
│     - MongoDB encryption at rest                             │
│     - S3 bucket encryption (server-side)                     │
│     - Backup encryption                                      │
│                                                               │
│  4. Network Layer                                            │
│     - VPC isolation                                          │
│     - Security groups (firewall rules)                       │
│     - Network ACLs                                           │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│              AUTHENTICATION & AUTHORIZATION                  │
│                                                               │
│  1. User Login                                               │
│     ├─> Email/Password validation                            │
│     ├─> Bcrypt password verification                         │
│     ├─> JWT token generation (24h expiry)                    │
│     └─> Refresh token (7 days expiry)                        │
│                                                               │
│  2. Request Authorization                                    │
│     ├─> JWT token validation (middleware)                    │
│     ├─> Token signature verification                         │
│     ├─> Token expiry check                                   │
│     └─> User role/permission check (RBAC)                    │
│                                                               │
│  3. Resource Access Control                                  │
│     ├─> Organization-level isolation                         │
│     ├─> Facility-level permissions                           │
│     ├─> User role validation                                 │
│     └─> Audit logging                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Scalability & High Availability

### Auto-Scaling Configuration

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTO-SCALING POLICY                       │
│                                                               │
│  Minimum Instances: 2                                        │
│  Maximum Instances: 10                                       │
│  Desired Capacity: 3                                         │
│                                                               │
│  Scale-Up Triggers:                                          │
│  - CPU utilization > 70% for 5 minutes                       │
│  - Memory utilization > 80% for 5 minutes                    │
│  - Request count > 1000/minute per instance                  │
│                                                               │
│  Scale-Down Triggers:                                        │
│  - CPU utilization < 30% for 10 minutes                      │
│  - Memory utilization < 40% for 10 minutes                   │
│                                                               │
│  Health Checks:                                              │
│  - Endpoint: /health                                         │
│  - Interval: 30 seconds                                      │
│  - Timeout: 5 seconds                                        │
│  - Unhealthy threshold: 2 consecutive failures               │
└─────────────────────────────────────────────────────────────┘
```

### Database Replication

```
┌─────────────────────────────────────────────────────────────┐
│              MONGODB ATLAS REPLICATION                       │
│                                                               │
│  Primary Region: us-east-1                                   │
│  ├─> Primary Node (us-east-1a)                               │
│  ├─> Secondary Node (us-east-1b)                             │
│  └─> Secondary Node (us-east-1c)                             │
│                                                               │
│  Backup Region: us-west-2 (Disaster Recovery)                │
│  └─> Continuous backup with point-in-time recovery           │
│                                                               │
│  Replication:                                                 │
│  - Automatic failover (< 30 seconds)                         │
│  - Read preference: Primary (consistency)                    │
│  - Write concern: Majority                                   │
│  - Oplog size: 5% of storage                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Monitoring & Logging

### Monitoring Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    MONITORING ARCHITECTURE                   │
│                                                               │
│  AWS CloudWatch                                              │
│  ├─> Application Logs (Node.js)                              │
│  ├─> Access Logs (ALB)                                       │
│  ├─> System Metrics (EC2)                                    │
│  ├─> Database Metrics (MongoDB Atlas)                        │
│  └─> Custom Metrics (API usage, AI calls)                    │
│                                                               │
│  AWS GuardDuty                                               │
│  ├─> Threat detection                                        │
│  ├─> Anomaly detection                                       │
│  └─> Security alerts                                         │
│                                                               │
│  AWS CloudTrail                                              │
│  ├─> API activity logging                                    │
│  ├─> Resource changes                                        │
│  └─> Compliance auditing                                     │
│                                                               │
│  Application Monitoring (Optional: New Relic/Datadog)        │
│  ├─> APM (response times, throughput)                        │
│  ├─> Error tracking                                          │
│  └─> User experience monitoring                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Disaster Recovery

### Backup Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    BACKUP & RECOVERY                         │
│                                                               │
│  Database Backups (MongoDB Atlas):                           │
│  ├─> Continuous backup (oplog)                               │
│  ├─> Daily snapshots (retained 7 days)                       │
│  ├─> Weekly snapshots (retained 4 weeks)                     │
│  ├─> Monthly snapshots (retained 12 months)                  │
│  └─> Point-in-time recovery (last 24 hours)                  │
│                                                               │
│  File Storage Backups (S3):                                  │
│  ├─> Versioning enabled                                      │
│  ├─> Cross-region replication (us-west-2)                    │
│  └─> Lifecycle policies (archive after 90 days)              │
│                                                               │
│  Application Code:                                           │
│  ├─> Git repository (GitHub)                                 │
│  ├─> Tagged releases                                         │
│  └─> Docker images (ECR)                                     │
│                                                               │
│  Recovery Objectives:                                        │
│  ├─> RTO (Recovery Time Objective): 4 hours                  │
│  ├─> RPO (Recovery Point Objective): 1 hour                  │
│  └─> DR Testing: Quarterly                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Integration Points for Brookdale

### Potential Integration Scenarios

```
┌─────────────────────────────────────────────────────────────┐
│              BROOKDALE INTEGRATION OPTIONS                   │
│                                                               │
│  1. Single Sign-On (SSO)                                     │
│     ├─> SAML 2.0 integration                                 │
│     ├─> Brookdale Identity Provider                          │
│     ├─> Just-in-Time (JIT) user provisioning                 │
│     └─> Port: 443 (HTTPS)                                    │
│                                                               │
│  2. LDAP/Active Directory                                    │
│     ├─> User synchronization                                 │
│     ├─> Group-based role mapping                             │
│     ├─> Port: 636 (LDAPS) or 389 (LDAP with StartTLS)       │
│     └─> Scheduled sync (daily/hourly)                        │
│                                                               │
│  3. API Integration                                          │
│     ├─> REST API endpoints                                   │
│     ├─> API key authentication                               │
│     ├─> Webhook notifications                                │
│     └─> Port: 443 (HTTPS)                                    │
│                                                               │
│  4. Data Export/Import                                       │
│     ├─> CSV/Excel export                                     │
│     ├─> JSON API responses                                   │
│     ├─> Scheduled reports                                    │
│     └─> SFTP file transfer (optional)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Performance Specifications

### Expected Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load Time | < 2 seconds | 95th percentile |
| API Response Time | < 500ms | Average |
| Database Query Time | < 100ms | Average |
| AI Agent Response | < 30 seconds | Average |
| Concurrent Users | 500+ | Per facility |
| Uptime | 99.9% | Monthly |
| File Upload | < 5 seconds | 10MB file |

---

## Compliance & Security Standards

### Standards Adherence

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPLIANCE FRAMEWORK                      │
│                                                               │
│  HIPAA Compliance:                                           │
│  ├─> Administrative Safeguards                               │
│  ├─> Physical Safeguards (AWS)                               │
│  ├─> Technical Safeguards                                    │
│  └─> Business Associate Agreements                           │
│                                                               │
│  Security Standards:                                         │
│  ├─> OWASP Top 10 protection                                 │
│  ├─> CIS Benchmarks                                          │
│  ├─> NIST Cybersecurity Framework                            │
│  └─> SOC 2 Type II (infrastructure)                          │
│                                                               │
│  Data Protection:                                            │
│  ├─> Encryption at rest (AES-256)                            │
│  ├─> Encryption in transit (TLS 1.2+)                        │
│  ├─> Access controls (RBAC)                                  │
│  ├─> Audit logging (7-year retention)                        │
│  └─> Data backup and recovery                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

### CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    CI/CD WORKFLOW                            │
│                                                               │
│  Developer Workflow:                                         │
│  1. Code commit to GitHub                                    │
│  2. GitHub Actions triggered                                 │
│  3. Automated tests run                                      │
│     ├─> Unit tests (Jest)                                    │
│     ├─> Integration tests                                    │
│     ├─> Security scanning (Snyk)                             │
│     └─> Code quality checks (ESLint)                         │
│  4. Build Docker image                                       │
│  5. Push to ECR (Elastic Container Registry)                 │
│  6. Deploy to staging environment                            │
│  7. Automated smoke tests                                    │
│  8. Manual approval for production                           │
│  9. Blue-green deployment to production                      │
│  10. Health check validation                                 │
│  11. Rollback on failure                                     │
│                                                               │
│  Deployment Frequency:                                       │
│  ├─> Development: Continuous                                 │
│  ├─> Staging: Daily                                          │
│  └─> Production: Bi-weekly (scheduled)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

This architecture provides:

✅ **High Availability:** Multi-AZ deployment, auto-scaling, load balancing  
✅ **Security:** End-to-end encryption, MFA, RBAC, HIPAA compliance  
✅ **Scalability:** Auto-scaling from 2-10 instances, MongoDB Atlas clustering  
✅ **Performance:** CDN, caching, optimized database queries, < 2s page loads  
✅ **Disaster Recovery:** Cross-region backups, RTO 4hrs, RPO 1hr  
✅ **Monitoring:** 24/7 CloudWatch, GuardDuty, comprehensive logging  
✅ **Integration Ready:** SAML/SSO, LDAP, REST APIs for Brookdale systems  

---

*Document Version 1.0 - January 5, 2025*  
*For technical questions, contact the MockSurvey365 architecture team*
