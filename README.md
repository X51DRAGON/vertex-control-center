<div align="center">

# Vertex Control Center

**AI Operations Dashboard — powered by Amy**

Monitor, command, approve, and observe your AI operations platform from a single beautiful interface.

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs](https://img.shields.io/badge/PRs-58%20merged-blueviolet)]()

</div>

---

## What is this?

Vertex Control Center is the client-facing operations dashboard for **Silver Snow Vertex** — an AI-powered business operations platform. It gives operators and clients real-time visibility into Amy, the AI operations assistant.

### What you can do

| Feature | Description |
|---------|-------------|
| 📊 **Command Bar** | Animated KPI strip — health gauge, 6 counters, pulsing LIVE indicator |
| 🧠 **Amy Intelligence** | Bridge health, system components, neural pipeline, knowledge search |
| 🗺️ **System Topology** | Interactive React Flow network graph — 10 nodes, hub-and-spoke layout, purple edge lines, click-to-detail |
| 🎯 **Quick Actions** | 6 one-click operations: health check, neural sync, approve/reject |
| ⏰ **Scheduler** | 10 recurring automations with real schedules, last run results |
| 📧 **Email Lane** | IMAP watcher status, draft/outbox counts, recent log |
| 🧠 **Intelligence Report** | Component scores (Logs, Approvals, Tasks, Scheduler, Knowledge) |
| ⚡ **Activity Stream** | Real-time feed from 5 engine modules (92+ events) |
| 📋 **Task Queue** | Submit and track tasks — watch Amy process them live |
| 🔐 **Approval Gate** | Approve/reject Amy's proposals with tier-based review |
| 🔔 **Notifications** | Priority-styled alerts: anomalies, council decisions, health reports |
| 📚 **Knowledge Vault** | Browse 8 knowledge domains, ingest new knowledge with auto-classification |
| 🔮 **Vault Search** | Full-text search across sovereign knowledge with domain badges |
| 💬 **Amy Chat** | Streaming AI responses via local Ollama, RAG-augmented |
| 📄 **Status Page** | Public GitHub-style system health page (no auth required) |
| 🚀 **Deploy System** | Automated client provisioning via `vertex-deploy.py` |

---

## Architecture

```
Vertex Control Center (:3000)        Amy API Bridge (:3100)          Ollama (:11434)
┌──────────────────────────┐    ┌──────────────────────────┐    ┌─────────────┐
│  Dashboard               │    │  /api/health             │    │  llama3.1   │
│  ├── Command Bar (KPIs)  │    │  /api/activity           │    │  8b local   │
│  ├── Amy Intelligence    │───▶│  /api/tasks    (CRUD)    │    └──────┬──────┘
│  ├── System Topology     │    │  /api/approvals (A/R)    │           │
│  ├── Quick Actions       │    │  /api/notifications      │    ┌──────▼──────┐
│  ├── Scheduler           │    │  /api/scheduler          │    │  Sovereign  │
│  ├── Email Lane          │    │  /api/email/status       │    │    Vault    │
│  ├── Intelligence Report │    │  /api/intelligence       │    │ 1.7M+ words │
│  ├── Activity Stream     │    │  /api/vault/search       │    └─────────────┘
│  ├── Task Queue          │    │  /api/knowledge/browse   │
│  ├── Approval Gate       │    │  /api/knowledge/ingest   │
│  ├── Notifications       │    │  /api/neurals/status     │
│  ├── Knowledge Vault     │    │  /api/status             │
│  ├── Vault Search        │    └──────────────────────────┘
│  └── Amy Chat (SSE)      │
│                          │
│  /status (public)        │
│  /api/amy/health (public)│
└──────────────────────────┘
```

## Quick Start

### For developers

```bash
git clone https://github.com/X51DRAGON/vertex-control-center.git
cd vertex-control-center
pnpm install
pnpm dev          # → http://localhost:3000
```

### For client deployment

```bash
python3 vertex-deploy.py --config clients/client.yaml --local
```

See `vertex-deploy.py` for the full 10-step automated provisioning pipeline.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (Turbopack) |
| UI | React 19, Tailwind CSS |
| Language | TypeScript 5.7 |
| Database | SQLite (better-sqlite3, WAL mode) |
| State | Zustand |
| AI | Ollama (local LLM) |
| Bridge | Python REST API (:3100) — 44 endpoints |
| Streaming | Server-Sent Events (SSE) |

## Bridge Endpoints

| Path | Method | Purpose |
|------|--------|---------|
| `/api/health` | GET | System health score + services |
| `/api/activity` | GET | Recent activity events |
| `/api/tasks` | GET/POST | Task queue (CRUD) |
| `/api/approvals` | GET | Pending approval proposals |
| `/api/approvals/:id/approve` | POST | Approve proposal |
| `/api/approvals/:id/reject` | POST | Reject proposal |
| `/api/notifications` | GET | Notification history |
| `/api/neurals/status` | GET | Neural sync status |
| `/api/vault/search` | GET | Search sovereign vault |
| `/api/knowledge/browse` | GET | List vault domains + files |
| `/api/knowledge/ingest` | POST | Submit new knowledge |
| `/api/scheduler` | GET | Automation routines + status |
| `/api/email/status` | GET | Email lane health + drafts |
| `/api/intelligence` | GET | Latest intelligence report |
| `/api/council` | GET | Council cases + advisor votes |
| `/api/logs` | GET | System log tail (10 files) |
| `/api/logs?name=X` | GET | Tail specific log file |
| `/api/capabilities` | GET | Capability registry + maturity |
| `/api/decisions` | GET | Architecture decisions + search |
| `/api/analytics` | GET | Session metrics + request rates |
| `/api/audit` | GET | Governance audit trail |
| `/api/telegram` | GET | Telegram bot sessions + status |
| `/api/environment` | GET | System environment overview |
| `/api/heatmap` | GET | 90-day activity heatmap data |
| `/api/storage` | GET | Disk usage breakdown |
| `/api/models` | GET | Ollama AI model registry |
| `/api/cron` | GET | Scheduler routines + timeline |
| `/api/errors` | GET | Cross-log error tracking |
| `/api/git` | GET | Repository stats + commits |
| `/api/uptime` | GET | Service uptime + process ages |
| `/api/performance` | GET | API request distribution + throughput |
| `/api/config` | GET | Platform configuration overview |
| `/api/dependencies` | GET | Module dependency graph |
| `/api/network` | GET | Network port scan + latencies |
| `/api/safety-rails` | GET | Safety guardrail layers + status |
| `/api/clawbytes` | GET | ClawBytes automation recipe catalogue |
| `/api/heartbeat` | GET | Real-time ops pulse + activity stats |
| `/api/scoreboard` | GET | Performance metrics + targets + trends |
| `/api/mission-status` | GET | Operational readiness scores by category |
| `/api/status` | GET | Full system status |

## Public Endpoints

| Path | Purpose |
|------|---------|
| `/status` | System health status page (GitHub-style) |
| `/api/amy/health` | JSON health check for monitoring |

## Custom Components (SSV)

| Component | Purpose | Lines |
|-----------|---------|-------|
| `command-bar.tsx` | Animated KPI strip with health gauge | 225 |
| `system-topology.tsx` | SVG architecture diagram with live health | 258 |
| `scheduler-panel.tsx` | 10 automation routines with expand | 193 |
| `intelligence-panel.tsx` | Email lane + intelligence report | 194 |
| `amy-status-widget.tsx` | Intelligence overview + knowledge search | ~200 |
| `activity-feed.tsx` | Real-time engine event timeline | 302 |
| `task-board.tsx` | Task CRUD with status badges | 244 |
| `approval-gate.tsx` | Human-in-the-loop approvals | 234 |
| `notification-history.tsx` | Priority-styled notification panel | 248 |
| `quick-actions.tsx` | One-click operation buttons | ~200 |
| `knowledge-manager.tsx` | Browse vault + ingest knowledge | ~300 |
| `vault-search.tsx` | Full-text vault search | 137 |
| `council-chamber.tsx` | Multi-model council decisions | 188 |
| `log-viewer.tsx` | 10-tab live log terminal | 166 |
| `capability-matrix.tsx` | Maturity registry + progress bar | 161 |
| `decision-log.tsx` | Architecture decision viewer | 114 |
| `session-analytics.tsx` | Live metrics + sparkline | 144 |
| `dashboard-footer.tsx` | Session status bar | 78 |
| `audit-trail.tsx` | Governance audit timeline | 130 |
| `telegram-monitor.tsx` | Bot session monitor | 120 |
| `neural-route-viz.tsx` | Cognitive routing flow | 151 |
| `keyboard-shortcuts.tsx` | Power user reference | 115 |
| `environment-inspector.tsx` | System overview | 121 |
| `activity-heatmap.tsx` | 90-day activity graph | 164 |
| `storage-monitor.tsx` | Disk usage breakdown | 95 |
| `model-registry.tsx` | Ollama AI models | 121 |
| `cron-timeline.tsx` | Scheduler routines | 99 |
| `error-tracker.tsx` | Cross-log error rates | 116 |
| `git-pulse.tsx` | Repository activity | 86 |
| `uptime-monitor.tsx` | Service availability | 96 |
| `performance-metrics.tsx` | API throughput + distribution | 101 |
| `config-viewer.tsx` | Platform configuration | 108 |
| `dependency-map.tsx` | Module import graph | 107 |
| `network-pulse.tsx` | Port scan + latency | 98 |
| `reagraph-topology.tsx` | Interactive React Flow topology with edges | 460 |
| `safety-rails.tsx` | 5-layer guardrail visualization panel | 320 |
| `clawbytes-recipes.tsx` | Automation recipe catalogue from OpenClaw | 301 |
| `ops-heartbeat.tsx` | Real-time pulse monitor with ECG animation | 292 |
| `ops-scoreboard.tsx` | Performance metrics with ring gauges | 264 |
| `mission-status.tsx` | Operational readiness pre-flight panel | 217 |
| `status/page.tsx` | Public health status page | 287 |
| `api/amy/chat/route.ts` | Ollama chat + RAG | 195 |
| `api/amy/stream/route.ts` | SSE streaming endpoint | 181 |
| `api/amy/health/route.ts` | Unified health aggregator | 151 |

## Fork Info

Forked from [builderz-labs/mission-control](https://github.com/builderz-labs/mission-control) (MIT, 2K ⭐).

SSV customizations:
- Purple theme (h:270) with SSV design tokens
- Amy AI integration (chat, streaming, RAG)
- 44 custom dashboard panels
- Public status page
- Client deployment system
- 44 bridge API endpoints

---

<div align="center">

**Silver Snow Vertex** — AI Operations, Sovereign & Local-first

[vertex.silversnowstudios.com](https://vertex.silversnowstudios.com)

</div>
