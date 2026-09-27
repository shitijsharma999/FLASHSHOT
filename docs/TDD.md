# Browser Competitive FPS

## Technical Design Document — v1.0

**Project type:** Browser-based competitive multiplayer FPS
**Primary inspiration:** Fast, accessible browser FPS games
**Target:** Deadshot.io-style accessibility with substantially higher visual quality
**Client:** TypeScript + Babylon.js
**Rendering:** WebGPU with WebGL2 fallback
**Game server:** Java 25 + Netty
**Platform services:** Java 25 + Spring Boot
**Database:** PostgreSQL
**Cache / ephemeral state:** Redis
**Asset storage/CDN:** S3-compatible object storage + Cloudflare/CDN
**Physics:** Havok on the client where useful; authoritative gameplay collision on the server
**Status:** Architecture baseline

---

# 1. Product Vision

The product is a **fast-loading, browser-native multiplayer first-person shooter** with the following characteristics:

* No traditional installation required.
* Desktop-first mouse/keyboard controls.
* Fast movement and responsive shooting.
* Competitive multiplayer.
* Short matchmaking time.
* High visual quality for a browser game.
* Good performance on mid-range hardware.
* WebGPU used where available, with WebGL2 fallback.
* Server-authoritative multiplayer.
* Strong resistance to basic client-side cheating.
* Architecture capable of growing from a prototype into a live-service game.

The central design principle is:

> **Competitive responsiveness first, graphics second, content scale third.**

Better graphics must never make movement, aiming, shooting, or hit registration feel worse.

---

# 2. Product Goals

## 2.1 Primary goals

### G1 — Instant accessibility

A user should be able to:

```text
Open browser
    ↓
Load game
    ↓
Enter menu
    ↓
Join match
```

without installing a native launcher.

### G2 — Competitive responsiveness

The game must support:

* client-side prediction
* server reconciliation
* remote-player interpolation
* authoritative hit validation
* lag compensation
* deterministic-ish simulation rules

### G3 — High visual quality

Target features include:

* PBR materials
* detailed weapons
* high-quality environment assets
* HDR environment lighting
* dynamic lights
* high-quality shadows
* ambient occlusion
* particles
* muzzle flashes
* bullet impacts
* weather/atmospherics where appropriate
* post-processing controlled by quality settings

Babylon.js provides WebGL 1/2 and WebGPU rendering, PBR/material systems, particles, audio, hardware-accelerated GUI, and Havok integration, making it suitable for this architecture.

### G4 — Scalable multiplayer

Initial target:

```text
8–12 players / match
```

Potential later target:

```text
16–24 players / match
```

The architecture should not hard-code the first player-count decision.

### G5 — Global deployment

The design must support regional game servers:

```text
India
Europe
North America
Southeast Asia
```

without changing the game protocol.

---

# 3. Non-Goals

The first release will not attempt to build:

* Battle royale
* 100+ player matches
* MMO-scale persistence
* Destructible entire maps
* Native mobile client
* Native console client
* full competitive esports infrastructure
* user-generated maps
* complex vehicles
* fully simulated real-world physics

These can be considered after the core FPS is proven.

---

# 4. Target Platforms

## 4.1 Primary

Desktop:

* Chrome
* Edge
* Firefox where feature support is sufficient

Target operating systems:

* Windows
* macOS
* Linux

## 4.2 Rendering paths

```text
                GAME CLIENT
                     │
          ┌──────────┴──────────┐
          │                     │
       WebGPU                 WebGL2
          │                     │
    High-quality path     Compatibility path
          │                     │
          └──────────┬──────────┘
                     │
                 Babylon.js
```

WebGPU is the preferred path, but WebGL2 remains important for compatibility. Babylon's current engine supports both.

We should **not** use Babylon Lite as the default engine for this project because Babylon Lite is WebGPU-exclusive; our main client needs a WebGL2 compatibility route. Babylon Lite can be evaluated later for a dedicated high-end WebGPU renderer if its constraints fit the game.

---

# 5. Technology Stack

## 5.1 Client

| Component                   | Technology                                  |
| --------------------------- | ------------------------------------------- |
| Language                    | TypeScript                                  |
| Build                       | Vite                                        |
| Rendering                   | Babylon.js 9.x                              |
| Preferred GPU API           | WebGPU                                      |
| Fallback                    | WebGL2                                      |
| Physics / character support | Havok integration where useful              |
| Models                      | glTF / GLB                                  |
| Textures                    | KTX2 / Basis-compatible compression         |
| UI                          | HTML/CSS + TypeScript                       |
| Audio                       | Web Audio / Babylon Audio                   |
| Networking                  | WebSocket                                   |
| State                       | Custom gameplay state + UI state separation |

Babylon currently documents Havok physics, a Havok Character Controller, GPU particles, animation systems, audio, GUI and WebGPU/WebGL support.

---

# 6. Java Backend Stack

## 6.1 Java version

Use:

```text
Java 25 LTS
```

Java 25 is the current LTS release as of September 2026. Java 21 is the previous LTS.

Avoid tying the project to Java 21 merely because it was a previous recommendation.

The actual JDK distribution can be selected separately; for a production project we should evaluate OpenJDK-based distributions and their support policies.

---

# 7. Real-Time Game Server

## 7.1 Core stack

```text
Java 25
   +
Netty
   +
Custom authoritative game loop
```

Netty is an asynchronous event-driven networking framework designed for high-performance network applications and supports both TCP-style and datagram networking abstractions. The current stable recommended release listed by Netty is 4.2.18.Final.

## 7.2 Responsibilities

The game server is responsible for:

* connection handling
* authentication/session validation
* player inputs
* authoritative movement
* weapon state
* ammo
* fire rate
* damage
* hit detection
* player health
* respawning
* match rules
* teams
* score
* timers
* objective state
* server-side anti-cheat checks
* authoritative world state
* snapshot generation

The client is **never the authority** for:

```text
Damage
Health
Ammo
Fire rate
Score
Match result
Inventory ownership
```

---

# 8. Spring Boot Platform Services

Spring Boot is **not** the 60-Hz game simulation.

It handles conventional backend services:

```text
Authentication
Accounts
Profiles
Friends
Parties
Inventory
Cosmetics
Stats
Leaderboards
Match history
Purchases
Administration
```

Current Spring Boot 4.1.1 requires at least Java 17 and supports Java through 26, so it is compatible with our Java 25 baseline.

Architecture:

```text
             Browser
                │
       ┌────────┴────────┐
       │                 │
    HTTPS             WebSocket
       │                 │
       ▼                 ▼
Spring Boot          Netty Game
Services             Server
```

---

# 9. Overall System Architecture

```text
                                  INTERNET
                                     │
                            ┌────────┴────────┐
                            │    Cloudflare   │
                            │ CDN / Edge      │
                            └────────┬────────┘
                                     │
                  ┌──────────────────┼──────────────────┐
                  │                  │                  │
                  ▼                  ▼                  ▼
              Static Site       Spring APIs        Game Servers
                  │                  │                  │
                  │                  │          ┌───────┼───────┐
                  │                  │          │       │       │
                  │                  │        India     EU      US
                  │                  │
                  │           ┌──────┴───────┐
                  │           │              │
                  │         Redis        PostgreSQL
                  │
                  ▼
             Browser Client
                  │
          TypeScript + Babylon
                  │
             WebGPU/WebGL2
```

---

# 10. Service Boundaries

The initial system should have these logical services.

## 10.1 Game Server

```text
game-server
```

Responsibilities:

* real-time match simulation
* network protocol
* players
* combat
* game rules

## 10.2 API Server

```text
api-server
```

Responsibilities:

* login
* profiles
* inventory
* progression
* social systems
* stats
* admin APIs

## 10.3 Matchmaker

Initially it may run inside the API/backend deployment.

Later:

```text
matchmaker-service
```

Responsibilities:

* queue players
* region selection
* skill/rating constraints
* party handling
* game-server allocation

## 10.4 Game Server Allocator

Later service:

```text
server-orchestrator
```

Responsibilities:

* discover available game servers
* create matches
* assign servers
* terminate empty servers
* report server health

---

# 11. Client Architecture

The browser client should use modular systems.

```text
client/
│
├── core/
│   ├── bootstrap
│   ├── config
│   ├── lifecycle
│   └── logging
│
├── rendering/
│   ├── engine
│   ├── materials
│   ├── lighting
│   ├── shadows
│   ├── postfx
│   └── quality
│
├── player/
│   ├── controller
│   ├── camera
│   ├── movement
│   └── animation
│
├── weapons/
│   ├── weapon-controller
│   ├── recoil
│   ├── muzzle
│   ├── projectile
│   └── hit-feedback
│
├── networking/
│   ├── websocket
│   ├── protocol
│   ├── prediction
│   ├── reconciliation
│   └── interpolation
│
├── world/
│   ├── maps
│   ├── entities
│   ├── props
│   └── streaming
│
├── audio/
│
├── ui/
│
└── telemetry/
```

---

# 12. Game Loop

The render loop and simulation loop must be separate.

## Client render loop

Target:

```text
60 FPS minimum
90/120/144+ FPS where hardware permits
```

## Client simulation

Runs at the rendering cadence but is driven by time/input state.

## Server

Initial target:

```text
60 ticks/second
```

Conceptually:

```text
SERVER
─────────────────────────

tick
 │
 ├── receive inputs
 ├── validate inputs
 ├── simulate players
 ├── process weapons
 ├── collision
 ├── hit detection
 ├── objectives
 ├── update match state
 └── generate snapshots
```

The simulation must use a fixed-step model as much as practical.

---

# 13. Multiplayer Model

The game uses:

## Server authority

```text
CLIENT
  │
  │ input
  ▼
SERVER
  │
  ├── validate
  ├── simulate
  └── broadcast
  │
  ▼
CLIENTS
```

The client predicts local movement immediately.

The server later confirms or corrects it.

---

# 14. Client Prediction

Suppose the user presses:

```text
W
```

The client immediately predicts movement.

It also sends:

```text
InputPacket {
    sequence = 1050
    forward = 1
    strafe = 0
    jump = false
    crouch = false
}
```

The server processes the command.

It eventually returns:

```text
AuthoritativeState {
    lastProcessedInput = 1050
    position = ...
    velocity = ...
}
```

The client then:

```text
Remove acknowledged inputs
        ↓
Apply server position
        ↓
Replay unacknowledged inputs
```

This is client-side prediction + reconciliation.

---

# 15. Remote Player Interpolation

Remote players should not simply snap between network snapshots.

Client maintains:

```text
Snapshot A
Snapshot B
```

and renders a smooth interpolated state.

This is independent of local-player prediction.

---

# 16. Networking Protocol

Start with a custom binary protocol.

Do not send verbose JSON for every 60-Hz gameplay update.

Example conceptual packet:

```text
[packet type]
[tick]
[player id]
[input]
[weapon state]
[sequence]
```

Possible serialization options:

### Phase 1

Compact custom binary encoding.

### Phase 2

Evaluate:

* FlatBuffers
* Protobuf
* custom packed structs

The protocol should be versioned:

```text
protocolVersion = 1
```

and support compatibility testing.

---

# 17. Networking Channels

Logical channels:

```text
RELIABLE
---------
login
match join
match start
inventory
loadout
chat
match result


UNRELIABLE / FREQUENT
---------------------
movement
aim
remote player state
effects
temporary state
```

Important gameplay events can be sent reliably even if the transport is primarily UDP-like in a future architecture.

For the first implementation, we can use WebSocket/TCP because browser simplicity is valuable. The networking layer should be abstracted so the game protocol isn't permanently tied to one transport.

---

# 18. Weapon Architecture

Every weapon is data-driven.

Example:

```text
WeaponDefinition

id
name
category
damage
headMultiplier
fireRate
magazineSize
reloadTime
range
spread
recoilPattern
movementPenalty
adsTime
fireMode
ammoType
```

This allows us to create weapons without rewriting gameplay code.

Example:

```text
AK-style rifle
SMG
shotgun
sniper
pistol
marksman rifle
```

The exact weapon roster will be designed separately.

---

# 19. Weapon Firing Pipeline

Client:

```text
mouse click
    ↓
local weapon animation
    ↓
local muzzle flash
    ↓
local audio
    ↓
input command
    ↓
server
```

Server:

```text
receive shot
    ↓
validate weapon
    ↓
validate ammo
    ↓
validate fire rate
    ↓
validate player state
    ↓
perform hit test
    ↓
apply damage
    ↓
generate authoritative result
```

Client should provide **instant feedback**, but the server determines the official result.

---

# 20. Hitscan vs Projectile

Use both.

## Hitscan

Best for:

* rifles
* pistols
* SMGs
* sniper rifles

Advantages:

* responsive
* low simulation cost
* suitable for high-rate weapons

## Projectile

For:

* grenades
* rockets
* specialized weapons

Projectile entities are simulated server-side.

---

# 21. Lag Compensation

For competitive weapons, the server should maintain limited historical player positions.

Example:

```text
current
- 16 ms
- 32 ms
- 48 ms
- 64 ms
- 80 ms
- 100 ms
```

When a shot arrives, the server may rewind relevant collision targets within a configured limit and validate the shot against the historical state.

The rewind limit should be bounded to prevent abuse.

---

# 22. Player Movement

Initial movement abilities:

* walk
* sprint
* jump
* crouch
* slide

Potential future additions:

* mantle
* vault
* wall interaction

Avoid adding advanced movement until base movement is stable.

Movement must prioritize:

```text
Input responsiveness
Predictability
Consistency
```

over realistic physics.

---

# 23. Physics Strategy

The client may use Babylon/Havok for appropriate physical interactions, but the multiplayer gameplay server should not depend on the browser's physics implementation for critical hit validation.

Critical server gameplay needs:

```text
player collision
weapon collision
raycasts
movement constraints
world collision
```

The server can use a simplified collision representation rather than reproducing the exact graphical physics scene.

This is important.

The server does **not** need to know every decorative object.

---

# 24. World Representation

Each map has two representations.

## Visual representation

```text
high-detail GLB
PBR materials
decals
lighting
props
VFX
```

## Gameplay representation

```text
collision meshes
hitboxes
spawn points
cover volumes
objectives
navigation/relevant regions
```

This dramatically reduces server complexity.

---

# 25. Graphics Architecture

Rendering layers:

```text
                 FRAME
                   │
        ┌──────────┴──────────┐
        │                     │
   Opaque Scene          Transparent/VFX
        │                     │
        ├── PBR              ├── particles
        ├── lighting         ├── smoke
        ├── shadows          ├── muzzle flash
        └── decals           └── impacts
                   │
                   ▼
             Post Processing
                   │
          ┌────────┼────────┐
          │        │        │
        bloom     AO      color
                   │
                   ▼
                 screen
```

Post-processing should be quality-tier dependent.

---

# 26. Graphics Quality Presets

## Low

* reduced shadows
* reduced texture resolution
* reduced particles
* minimal post-processing
* reduced view distance

## Medium

* PBR
* dynamic shadows
* moderate particles
* ambient occlusion
* moderate post effects

## High

* high-quality shadows
* stronger environment lighting
* high-quality particles
* high-quality textures
* advanced post effects

## Ultra

* maximum supported shadow quality
* additional effects
* higher texture resolution
* advanced reflections where justified
* higher environment detail

The game should automatically suggest an initial preset based on hardware, but the user remains in control.

---

# 27. Graphics Performance Budget

Initial target on the reference mid-range system:

```text
Average:      ≥ 90 FPS
1% low:       ≥ 60 FPS
Frame spikes: minimized
```

For competitive play:

```text
Input → simulation → rendering
```

must remain responsive even when graphics settings are high.

We should benchmark:

```text
CPU frame time
GPU frame time
draw calls
triangles
texture memory
VRAM pressure
JavaScript heap
WebSocket traffic
```

---

# 28. Asset Pipeline

```text
                BLENDER
                   │
              High-poly model
                   │
                   ▼
             Retopologizing
                   │
                   ▼
               UV layout
                   │
                   ▼
            Texture authoring
                   │
                   ▼
          Normal/AO/Roughness
                   │
                   ▼
                 GLB
                   │
          ┌────────┴────────┐
          ▼                 ▼
      optimization      compression
          │                 │
          └────────┬────────┘
                   ▼
                  CDN
                   │
                   ▼
               Browser
```

Textures should be compressed appropriately for the web.

---

# 29. Asset Categories

Initial asset groups:

### Characters

* 1 player body
* first-person arms
* armor/cosmetics later

### Weapons

Start with approximately:

```text
2 rifles
1 SMG
1 shotgun
1 sniper
1 pistol
```

### Environment

One polished map first.

Map should include:

* spawn areas
* lanes
* cover
* verticality
* sightline control
* objective spaces
* visual landmarks

---

# 30. Audio Architecture

Audio is an important part of perceived quality.

Systems:

```text
weapon fire
reload
empty magazine
footsteps
jump
land
slide
hit
headshot
environment
UI
music
voice
```

Spatial audio should be used selectively.

Priority:

```text
footsteps
gunshots
hit feedback
reloads
```

before decorative ambience.

---

# 31. Game Modes

## MVP

### Free-for-All

```text
Player vs everyone
```

### Team Deathmatch

```text
Team A
vs
Team B
```

## Post-MVP

### Capture the Flag

```text
Base A → Flag → Base B
```

### King of the Hill

### Gun Game

### Private Match

### Practice Range

---

# 32. Match Lifecycle

```text
QUEUE
  ↓
MATCHMAKING
  ↓
SERVER ALLOCATION
  ↓
LOBBY
  ↓
LOADING
  ↓
COUNTDOWN
  ↓
ACTIVE MATCH
  ↓
MATCH END
  ↓
RESULTS
  ↓
XP / STATS
  ↓
QUEUE AGAIN
```

---

# 33. Matchmaking

Initial matchmaking requirements:

* region
* party size
* game mode
* available server capacity

Later:

* skill rating
* latency
* previous match history
* queue duration

Do not optimize matchmaking around hidden skill logic until there is enough player data.

---

# 34. Database

Use PostgreSQL as the persistent relational database.

The current PostgreSQL documentation lists PostgreSQL 18 as the current supported major version as of September 2026.

Recommended major:

```text
PostgreSQL 18
```

Core tables:

```text
users
accounts
sessions
profiles
friends
friend_requests
parties
matches
match_players
player_statistics
weapons
loadouts
cosmetics
inventory
xp_progression
leaderboards
reports
bans
audit_logs
```

---

# 35. Redis

Redis handles ephemeral/high-speed data such as:

```text
session presence
matchmaking queues
server registry
party state
rate limits
temporary match state
distributed locks
pub/sub where appropriate
```

Redis is explicitly designed for in-memory data structures and can also act as a cache, message broker and streaming engine.

Redis must **not** become the authoritative source of the actual running FPS simulation.

The game server owns live match state.

---

# 36. Persistence Strategy

During the match:

```text
Game Server RAM
```

After important events:

```text
Game Server
   ↓
event / result
   ↓
backend
   ↓
PostgreSQL
```

Examples:

```text
match started
match ended
player statistics
XP awarded
ranked result
inventory change
purchase
```

Do not write every position update to PostgreSQL.

---

# 37. Authentication

Initial authentication options:

```text
email/password
OAuth providers
guest account
```

Tokens:

```text
short-lived access token
+
refresh token
```

Game server performs session/token validation before allowing matchmaking participation.

Never trust a client-provided:

```text
userId
inventory
weapon ownership
rank
XP
currency
```

---

# 38. Anti-Cheat Architecture

The first line of defense is server authority.

Server validates:

```text
movement speed
acceleration
fire rate
ammo
reload state
weapon ownership
damage
teleport-like movement
impossible input sequences
```

Additional telemetry can identify suspicious patterns.

Client-side anti-cheat can be considered later, but it should never replace server validation.

---

# 39. Security

Minimum requirements:

* TLS
* secure cookies/tokens where applicable
* input validation
* server-side authorization
* rate limiting
* account lockout mechanisms
* replay protection
* request validation
* audit logs
* secret management
* database least-privilege credentials

Spring APIs and game-server connections should have separate security responsibilities.

---

# 40. Server Deployment

One game-server instance:

```text
Docker container
        │
        ▼
Java 25
        │
     Netty
        │
   Game loop
```

Many instances:

```text
                SERVER ALLOCATOR
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
     Game #1         Game #2        Game #3
      India           India          EU
```

A game server should be disposable.

If a server dies:

```text
server unavailable
       ↓
match marked interrupted
       ↓
players returned to matchmaking
```

---

# 41. Infrastructure

Initial deployment:

```text
Cloudflare
    │
    ├── CDN
    ├── DNS
    └── TLS
         │
         ▼
Cloud compute
    │
    ├── API servers
    ├── Matchmaker
    └── Game servers
         │
         ├── PostgreSQL
         └── Redis
```

Assets:

```text
Object Storage
     ↓
Cloudflare CDN
     ↓
Browser
```

This keeps large 3D assets away from the application servers.

---

# 42. Observability

Every server should expose:

### Metrics

```text
CPU
RAM
GC
network
tick duration
tick overruns
connected players
packet rate
match count
queue length
database latency
Redis latency
```

### Game metrics

```text
average ping
packet loss
server tick rate
client FPS
frame time
weapon usage
match duration
disconnect rate
```

### Logging

Use structured logs:

```json
{
  "event": "match_started",
  "matchId": "...",
  "region": "ap-south",
  "players": 10
}
```

Avoid free-form logs for important operational events.

---

# 43. Monitoring Stack

Initial:

```text
Prometheus
    ↓
Grafana
```

Logs:

```text
Loki / OpenSearch / equivalent
```

Error monitoring:

```text
Sentry / equivalent
```

The exact vendor can be decided during infrastructure implementation.

---

# 44. Repository Structure

A monorepo is recommended initially.

```text
game/
│
├── apps/
│   ├── client/
│   ├── game-server/
│   └── api-server/
│
├── packages/
│   ├── protocol/
│   ├── shared-types/
│   ├── weapon-definitions/
│   └── map-definitions/
│
├── infrastructure/
│   ├── docker/
│   ├── terraform/
│   └── configs/
│
├── assets/
│   ├── source/
│   ├── exported/
│   └── validation/
│
└── docs/
    ├── architecture/
    ├── protocol/
    ├── gameplay/
    └── art/
```

Java modules can live within the same repository while remaining independent applications.

---

# 45. Java Game Server Package Structure

```text
game-server/
└── src/main/java/
    └── com/game/server/
        ├── bootstrap/
        ├── network/
        ├── protocol/
        ├── session/
        ├── game/
        │   ├── loop/
        │   ├── world/
        │   ├── player/
        │   ├── weapons/
        │   ├── combat/
        │   └── objectives/
        ├── physics/
        ├── matchmaking/
        ├── security/
        ├── telemetry/
        └── persistence/
```

Important rule:

> The game loop must not become dependent on Spring's request/response lifecycle.

---

# 46. API Server Package Structure

```text
api-server/
└── src/main/java/
    └── com/game/api/
        ├── auth/
        ├── users/
        ├── profiles/
        ├── friends/
        ├── parties/
        ├── inventory/
        ├── cosmetics/
        ├── progression/
        ├── statistics/
        ├── leaderboards/
        ├── matches/
        ├── admin/
        └── infrastructure/
```

Spring Boot handles API concerns, not real-time gameplay.

---

# 47. Testing Strategy

Testing is divided into four layers.

## Unit tests

For:

* recoil
* damage
* weapon rules
* movement calculations
* matchmaking
* packet encoding

## Integration tests

For:

* PostgreSQL
* Redis
* API
* authentication
* game server connections

## Simulation tests

Run matches without graphics:

```text
10 bots
1000 simulated shots
movement
respawns
objectives
```

and verify expected outcomes.

## End-to-end tests

```text
Browser
  ↓
API
  ↓
Matchmaker
  ↓
Game server
  ↓
Database
```

---

# 48. Bot Testing

Bots are useful even before AI is sophisticated.

A headless bot client should be capable of:

```text
connect
authenticate
join match
move
aim
shoot
die
respawn
leave
```

This lets us load-test:

```text
2 players
10 players
50 concurrent players
100 concurrent players
500 concurrent players
```

without requiring humans.

---

# 49. Performance Test Targets

Before public beta:

## Client

```text
reference machine:
≥ 90 FPS target
≥ 60 FPS 1% low
```

## Game server

Target:

```text
60 Hz simulation
```

with server tick duration comfortably below:

```text
16.67 ms
```

The exact production budget should be finalized after profiling.

The important metric is not theoretical CPU speed; it is whether the server can sustain the target tick under realistic worst-case match load.

---

# 50. Network Targets

Initial design goals:

```text
Gameplay snapshot: ~20–30 Hz
Server simulation: 60 Hz
Input transmission: adaptive / client driven
```

We should measure rather than blindly maximize packet frequency.

Target:

```text
low bandwidth
low latency
stable jitter
```

Network messages should be compressed or packed as the protocol matures.

---

# 51. Browser Loading Strategy

Initial page:

```text
HTML
CSS
minimal JS
loading UI
```

Then:

```text
engine
    ↓
core shaders
    ↓
player
    ↓
current map
    ↓
weapon assets
    ↓
optional assets
```

Don't make every cosmetic asset part of the initial download.

---

# 52. Asset Streaming

Maps should be divided logically:

```text
Map
├── common
├── spawn A
├── spawn B
├── center
├── objective
└── decorative
```

Load what is required first.

Later:

```text
distance-based
visibility-based
match-state-based
```

asset loading can be introduced.

---

# 53. UI Architecture

The UI should not be rendered through expensive 3D geometry unless necessary.

Use:

```text
HTML/CSS
```

for:

* menus
* settings
* inventory
* friends
* matchmaking
* scoreboard

Use game rendering for:

* crosshair
* hit marker
* HUD elements that tightly synchronize with gameplay
* weapon view
* world-space indicators

The UI must scale properly across resolutions.

---

# 54. Input System

Keyboard:

```text
W/A/S/D
Shift
Ctrl
Space
R
1-5
Tab
Esc
```

Mouse:

```text
look
fire
ADS
weapon selection
```

Controller support can be added after keyboard/mouse is solid.

Controller architecture should be implemented through an abstract input layer so we do not rewrite gameplay later.

---

# 55. Game State Model

Client:

```text
Menu
 ↓
Connecting
 ↓
Authenticated
 ↓
Matchmaking
 ↓
Loading
 ↓
Playing
 ↓
Scoreboard
 ↓
Results
```

Server:

```text
WAITING
 ↓
STARTING
 ↓
LIVE
 ↓
ENDING
 ↓
ENDED
```

State transitions should be explicit and validated.

---

# 56. Match State

Authoritative server maintains:

```text
matchId
mapId
mode
startTime
remainingTime
teams
players
scores
objectives
roundState
spawnState
winner
```

Client receives only the information required to render/operate the match.

---

# 57. Inventory and Progression

Inventory belongs to the backend, not the client.

Example:

```text
PostgreSQL

user
  ↓
inventory
  ↓
owned cosmetics
  ↓
loadout
```

Client merely requests:

```text
"Give me my loadout."
```

Server determines whether the user actually owns the items.

---

# 58. Cosmetics Architecture

Weapons and player models must support cosmetic layers:

```text
Base Mesh
   +
Material
   +
Texture
   +
Decal
   +
Optional attachments
```

Cosmetics should not alter competitive gameplay in ranked modes unless deliberately designed to.

---

# 59. Map Design Rules

The first map should prioritize:

### Clear combat lanes

```text
Lane A
Lane B
Lane C
```

### Cover

Every major lane should have meaningful cover choices.

### Sightlines

Avoid giant uninterrupted sightlines.

### Spawn protection

Players should not spawn directly into unavoidable enemy fire.

### Rotation

Provide multiple ways to move between zones.

---

# 60. First Map Scope

For MVP:

```text
1 map
```

Map characteristics:

```text
small/medium
3 primary lanes
2 spawn areas
central combat zone
multiple cover pieces
vertical elements
one objective area
```

Art quality matters more than map count at this stage.

---

# 61. First Weapon Set

MVP:

```text
Assault rifle
SMG
Shotgun
Sniper
Pistol
```

Each weapon must have:

* idle
* fire
* reload
* ADS
* recoil
* inspect
* equip
* muzzle flash
* shell/ejection effect where applicable
* sound set

---

# 62. First-Person Animation System

Required:

```text
idle
walk
sprint
jump
fall
land
crouch
slide
fire
reload
ADS
weapon switch
```

Use animation blending instead of one giant state animation.

---

# 63. Visual Differentiation Strategy

The goal is not simply:

```text
More polygons
```

It is:

```text
Better materials
+
better lighting
+
better composition
+
better animation
+
better VFX
+
better audio
```

A 20,000-polygon weapon with excellent materials can look substantially better than a 100,000-polygon model with poor lighting.

---

# 64. Development Phases

## Phase 0 — Technical foundation

Deliver:

```text
repo
CI
client shell
Java game server
Spring API
PostgreSQL
Redis
Docker
basic deployment
```

Acceptance:

```text
browser connects to Java server
```

---

## Phase 1 — Single-player FPS sandbox

Deliver:

```text
first-person camera
movement
jump
sprint
weapon
shooting
collision
one test environment
```

Acceptance:

```text
walking and shooting feels good
```

---

## Phase 2 — Multiplayer core

Deliver:

```text
2–4 players
authoritative server
prediction
reconciliation
interpolation
shooting
damage
respawn
```

Acceptance:

```text
real players can fight each other reliably
```

---

## Phase 3 — Vertical slice

Deliver:

```text
1 polished map
5 weapons
high-quality environment
animations
audio
VFX
UI
```

Acceptance:

```text
It already feels like a real game.
```

---

## Phase 4 — Match infrastructure

Deliver:

```text
login
matchmaking
lobby
server allocation
match lifecycle
stats
```

---

## Phase 5 — Content

Deliver:

```text
additional maps
additional weapons
game modes
progression
cosmetics
```

---

## Phase 6 — Beta hardening

Deliver:

```text
anti-cheat
load testing
monitoring
crash handling
analytics
security audit
browser compatibility
```

---

# 65. MVP Definition

MVP is complete when:

```text
✓ Browser loads game
✓ User can create/login
✓ User can enter matchmaking
✓ Match server is allocated
✓ 8–12 players can connect
✓ Movement is responsive
✓ Shooting is responsive
✓ Server determines damage
✓ Players can die/respawn
✓ TDM works
✓ One polished map exists
✓ Five weapons exist
✓ Audio works
✓ Good visual-quality preset exists
✓ WebGPU path works
✓ WebGL2 fallback works
✓ Match results persist
✓ Basic stats persist
```

---

# 66. MVP Does Not Require

```text
Ranked
Battle pass
Store
Huge cosmetic catalogue
Voice chat
Clan system
Dozens of maps
Hundreds of weapons
Esports mode
Mobile client
```

Those belong later.

---

# 67. Scaling Strategy

## Stage 1

```text
1 region
few game servers
single PostgreSQL
single Redis
```

## Stage 2

```text
multiple game-server instances
read replicas
Redis high availability
CDN
```

## Stage 3

```text
multiple geographic regions
regional matchmaking
server allocator
database scaling
```

## Stage 4

```text
independent services
automatic server provisioning
global routing
advanced telemetry
```

Do not build Stage 4 infrastructure before Stage 1 proves the game.

---

# 68. Important Architecture Rule

The game server should be **stateless at the infrastructure level** but stateful during an individual match.

Meaning:

```text
Game Server Process
   ↓
owns Match #1827
   ↓
RAM contains live match state
```

If the server process terminates:

```text
Match #1827
   ↓
lost/interrupted
```

Players can reconnect to matchmaking.

Persistent user information remains safely in backend storage.

---

# 69. Failure Handling

## Database unavailable

Game server continues the active match where possible.

Persistent operations are buffered/failed safely.

## Redis unavailable

Game servers continue existing matches where possible.

Matchmaking may be degraded.

## Game server crashes

Match is terminated and clients are returned to the frontend.

## API unavailable

Existing game matches should continue.

This separation is intentional.

---

# 70. Security Boundaries

```text
                INTERNET
                   │
             Cloudflare
                   │
        ┌──────────┴──────────┐
        │                     │
       API                 GAME SERVER
        │                     │
        ▼                     ▼
     backend               match state
        │                     │
   PostgreSQL              memory
```

A compromised browser must not be able to modify:

```text
server health
match result
weapon ownership
currency
damage
other players
```

---

# 71. Initial Team Structure

A small team could be organized as:

```text
1 Technical Lead / Backend
1 Gameplay Engineer
1 Web/Rendering Engineer
1 3D Artist
1 Technical Artist
1 Backend/Infrastructure Engineer
1 QA/Automation
```

Some positions can initially overlap.

---

# 72. Engineering Priorities

Priority order:

```text
1. Movement
2. Shooting
3. Networking
4. Hit registration
5. Performance
6. Map quality
7. Audio
8. VFX
9. Progression
10. Cosmetics
```

The first five are the core of the game.

---

# 73. Architecture Decisions

## Decision A

Use **Babylon.js** rather than raw WebGL.

Reason:

It provides a broader game-engine layer including rendering, animation, physics integration, particles, audio and GUI.

## Decision B

Use **WebGPU first, WebGL2 fallback**.

Reason:

High-end visual path without abandoning browser compatibility.

## Decision C

Use **Java 25 + Netty** for the game server.

Reason:

High-performance, event-driven networking plus a strong JVM ecosystem. Netty explicitly targets high-performance protocol servers/clients.

## Decision D

Use **Spring Boot** for conventional backend services.

Reason:

Strong ecosystem for authentication, REST APIs, persistence and platform functionality.

## Decision E

Use **PostgreSQL** for persistent relational data.

## Decision F

Use **Redis** for temporary/high-speed distributed state.

---

# 74. What We Should Build First

The first engineering repository should contain exactly:

```text
/browser-fps
│
├── client/
│   ├── Babylon bootstrap
│   ├── WebGPU/WebGL2 selection
│   ├── FPS camera
│   ├── WASD
│   └── mouse look
│
├── game-server/
│   ├── Java 25
│   ├── Netty
│   ├── connection manager
│   ├── packet protocol
│   ├── 60 Hz loop
│   └── player state
│
├── api-server/
│   ├── Spring Boot
│   ├── authentication
│   └── health endpoint
│
├── shared/
│   └── protocol definitions
│
├── infra/
│   ├── docker-compose
│   └── development configs
│
└── docs/
    └── architecture
```

---

# 75. First Technical Milestone

The very first successful build should achieve:

```text
Chrome
   ↓
Browser game
   ↓
3D arena
   ↓
First-person camera
   ↓
WASD movement
   ↓
Mouse aiming
   ↓
Java 25 Netty server
   ↓
2 connected players
   ↓
Players see each other
   ↓
Players move
   ↓
Players shoot
   ↓
Server validates hit
```

That is our **vertical technical proof**.

Once that works, we have proven the most important parts of the architecture.

---

# 76. Long-Term Architecture

The final conceptual system is:

```text
                              PLAYER
                                │
                         Browser / Chrome
                                │
                ┌───────────────┴────────────────┐
                │                                │
         TypeScript Client                 HTTPS APIs
                │                                │
        Babylon.js/WebGPU                 Spring Boot
                │                                │
        WebSocket protocol               PostgreSQL/Redis
                │
                ▼
        ┌───────────────────┐
        │ Java 25 Game      │
        │ Server / Netty    │
        │                   │
        │ 60 Hz simulation  │
        │ authoritative     │
        │ combat            │
        │ movement          │
        │ objectives        │
        └─────────┬─────────┘
                  │
            server registry
                  │
          ┌───────┼────────┐
          ▼       ▼        ▼
        India     EU       US
        Server   Server   Server
```

---

# 77. Final Technical Position

The selected architecture is therefore:

```text
FRONTEND

TypeScript
     ↓
Babylon.js
     ↓
WebGPU
     ↓
WebGL2 fallback


REAL-TIME BACKEND

Java 25
     ↓
Netty
     ↓
Authoritative 60 Hz game simulation


PLATFORM BACKEND

Java 25
     ↓
Spring Boot
     ↓
PostgreSQL + Redis


INFRASTRUCTURE

Docker
     ↓
Cloudflare
     ↓
CDN
     ↓
Object Storage
     ↓
Regional game servers


ART

Blender
     ↓
Substance/material workflow
     ↓
GLB + compressed textures
     ↓
CDN
```

This stack is deliberately split into **three different concerns**:

```text
Browser rendering
       ≠
Real-time game simulation
       ≠
Normal web backend
```

That separation is the most important architectural decision in this TDD.

# 78. Immediate Next Engineering Deliverable

The next document should be the **Implementation Specification**, which turns this TDD into actual build instructions:

```text
1. Monorepo creation
2. Babylon.js client bootstrap
3. WebGPU/WebGL2 initialization
4. Java 25 + Netty server bootstrap
5. Spring Boot API bootstrap
6. PostgreSQL + Redis Docker environment
7. Binary packet protocol
8. Player state model
9. 60 Hz game loop
10. Client prediction
11. Server reconciliation
12. FPS controller
13. Weapon system
14. Hit detection
15. Two-player multiplayer prototype
16. Automated tests
17. CI/CD
```

That implementation specification should be written **before we start adding maps, weapons or advanced graphics**, because it will define the actual codebase boundaries and prevent us from rewriting the networking architecture later.

### Current technology references

Babylon.js documents WebGPU/WebGL support, Havok integration, particles, animation and audio.
Netty's current stable recommended release is 4.2.18.Final as of September 2026.
Spring Boot 4.1.1 supports Java 17 through Java 26.
PostgreSQL 18 is currently supported as the current major version.
Java 25 is the current LTS release, with Java 21 now the previous LTS.
Redis documents its use as an in-memory data store, cache, streaming engine and message broker.
