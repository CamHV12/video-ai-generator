# AI Video Generator

A local-first, single-page AI video generation application.

## Confirmed architecture

- Frontend: React, Vite, TypeScript.
- Backend: Java 21, Spring Boot.
- Storage: local Windows folders; no database.
- AI: online provider API, to be selected only after verifying image + reference-video support.
- UI: one main page for source image, reference video, generation settings, progress, and result.

## Repository status

This repository starts with a Phase 0 baseline. AI generation is intentionally not implemented until the selected provider and endpoint are verified.

## Prerequisites

- Node.js LTS and npm
- JDK 21
- Apache Maven 3.9+
- Git
- Internet access for dependency downloads and, later, the AI provider API

## Run on Windows

### 1. Backend

```powershell
cd backend
mvn spring-boot:run
```

The backend health endpoint is `http://localhost:8080/api/health`.

Storage folders are created under `data/` at the repository root by default. Override the root with the `APP_STORAGE_ROOT` environment variable.

### 2. Frontend

In a second PowerShell window:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`).

## Local storage layout

```text
data/
  input/
    images/
    videos/
  output/
  temp/
```

The application does not use a database. Do not commit local input/output files or secrets.

## Environment variables

See `.env.example`. Backend secrets must be configured as operating-system environment variables or in a local, untracked configuration. Never expose an AI API key through a `VITE_*` variable.

## Phase plan

1. Phase 0: requirements, repository baseline, environment, and test plan.
2. Phase 1: single-page UI/UX.
3. Phase 2: upload and local file validation.
4. Phase 3: verify AI provider/model and implement provider adapter.
5. Phase 4: asynchronous task lifecycle and local output storage.
6. Phase 5: connect UI to real generation.
7. Phase 6: security, integration tests, and hardening.
8. Phase 7: local packaging/deployment and acceptance testing.
