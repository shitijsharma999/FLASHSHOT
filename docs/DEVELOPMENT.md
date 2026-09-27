# Development guide (Phase 0)

This repository follows the monorepo layout in [`TDD.md`](./TDD.md) §44.

## Prerequisites

| Tool | Version (TDD baseline) | Notes |
| --- | --- | --- |
| Node.js | 20+ (22 recommended for CI parity) | Client + shared TypeScript packages |
| npm | 10+ | Workspaces at repository root |
| JDK | **25** (Temurin recommended) | Game server + API server |
| Gradle | Wrapper (`gradlew`) | No global Gradle install required |
| Docker | Recent | PostgreSQL 18 + Redis for local infra |

The Gradle wrapper uses **JDK 21** locally (see `org.gradle.java.home` in [`gradle.properties`](../gradle.properties)) because the Gradle 8.14 daemon does not run on JDK 25 yet. Application code still compiles with the **Java 25 toolchain** (Foojay resolver downloads Temurin 25 on first build if needed).

If you install JDK 21 and JDK 25 globally, you can remove or override `org.gradle.java.home`.

## Install dependencies

```bash
npm install
```

Java dependencies resolve on the first `./gradlew` invocation.

Copy environment defaults:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

## Environment variables

All documented variables live in [`.env.example`](../.env.example) at the repository root.

| Variable | Consumer | Purpose |
| --- | --- | --- |
| `VITE_*` | Browser client (Vite) | Public client endpoints only |
| `API_SERVER_PORT` | Spring API | HTTP port (default `8080`) |
| `DATABASE_*` / `DATABASE_URL` | API (Phase 0 wired, autoconfig disabled until schema work) | PostgreSQL |
| `REDIS_*` | API (Phase 0 wired, autoconfig disabled until used) | Redis |
| `GAME_SERVER_*` | Netty game server | WebSocket + HTTP health ports |

Vite loads env files from the repository root (`apps/client/vite.config.ts` sets `envDir: "../.."`).

## Local infrastructure (PostgreSQL + Redis)

```bash
npm run infra:up
```

Stop:

```bash
npm run infra:down
```

Compose file: [`infrastructure/docker/docker-compose.yml`](../infrastructure/docker/docker-compose.yml).

## Run the client

```bash
npm run dev:client
```

Open `http://localhost:5173`. The boot screen reports renderer backend, API health, and game-server WebSocket handshake status.

## Run the game server (Netty)

```bash
./gradlew :game-server:run
```

Windows:

```powershell
.\gradlew.bat :game-server:run
```

Defaults:

- WebSocket: `ws://localhost:9090/ws`
- HTTP health: `http://localhost:9091/health`

## Run the API server (Spring Boot)

```bash
./gradlew :api-server:bootRun
```

Health: `http://localhost:8080/health`

Phase 0 excludes PostgreSQL/Redis autoconfiguration so the API starts without Docker; database services are still provisioned via Compose for upcoming phases.

## Tests

TypeScript (all workspaces):

```bash
npm test
```

Java:

```bash
./gradlew test
```

Full local check script (TypeScript + client production build + Java build):

```bash
npm run check
```

## Linting & formatting

```bash
npm run lint
npm run format:check
```

Auto-fix:

```bash
npm run lint:fix
npm run format
```

## Production builds

Client static assets:

```bash
npm run build:client
```

Output: `apps/client/dist/`

Java fat JARs:

```bash
./gradlew :game-server:build :api-server:bootJar
```

Docker images (after JARs exist) use [`infrastructure/docker/`](../infrastructure/docker/).

## Repository layout (Phase 0)

```text
apps/client/          TypeScript + Vite + Babylon bootstrap
apps/game-server/     Java 25 + Netty
apps/api-server/      Java 25 + Spring Boot
packages/*            Shared TypeScript modules
infrastructure/       Docker, Terraform placeholder, configs
assets/               Art pipeline directories (no gameplay assets yet)
docs/                 TDD + development docs
```

## Phase 0 acceptance (from TDD §64)

With the client, game server, and API running, the browser boot screen should show a successful game-server WebSocket hello handshake. Gameplay systems are intentionally not implemented yet.
