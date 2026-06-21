# TaskBricks Frontend

Production TaskBricks web app built with Next.js, React, Tailwind CSS, and the backend API in `taskbricks-be`.

## Requirements

- Node.js 22
- npm
- A running backend API, normally `http://localhost:4070/api/v1`

## Setup

Install dependencies:

```bash
npm ci
```

Create local environment config:

```bash
cp .env.example .env.local
```

Review these values before starting the app:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4070/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:4070
NEXT_PUBLIC_API_DOCS_URL=http://localhost:4070/api/docs
```

Only browser-safe values should use the `NEXT_PUBLIC_` prefix. Server secrets, API secrets, refresh tokens, and trusted-device tokens must not be stored in this frontend env file.

## Develop

Start the backend first, then run:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Validate

```bash
npm run lint
npm run build
```

Regenerate committed OpenAPI types after backend route or DTO changes:

```bash
npm run api:generate
```

The backend contract verifier lives in `taskbricks-be` and checks the frontend API helper coverage against exported OpenAPI routes:

```bash
npm --prefix ../taskbricks-be run frontend:contract
```

## Deploy

Build this directory as the web frontend. The archived root Vite app in the parent repository is legacy code and should not be used for production deployment.
