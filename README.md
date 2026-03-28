<div align="center">

# Vertex Control Center

**AI Operations Dashboard — powered by Amy**

Monitor, command, approve, and observe your AI operations platform from a single beautiful interface.

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs](https://img.shields.io/badge/PRs-9%20merged-blueviolet)]()

</div>

---

## What is this?

Vertex Control Center is the client-facing operations dashboard for **Silver Snow Vertex** — an AI-powered business operations platform. It gives operators and clients real-time visibility into Amy, the AI operations assistant.

### What you can do

| Feature | Description |
|---------|-------------|
| 💬 **Chat with Amy** | Streaming AI responses via local Ollama, RAG-augmented from knowledge base |
| ⚡ **Activity Stream** | Real-time feed from 5 engine modules (92+ events) |
| 📋 **Task Queue** | Submit and track tasks — watch Amy process them live |
| 🔐 **Approval Gate** | Approve/reject Amy's proposals with tier-based review |
| 🔔 **Notifications** | Priority-styled alerts: anomalies, council decisions, health reports |
| 🎯 **Quick Actions** | One-click operations: health check, neural sync, intelligence report |
| 📊 **Status Page** | Public GitHub-style system health page (no auth) |
| 🧠 **Intelligence Widget** | Health score, neural pipeline, knowledge search |

---

## Architecture

```
Vertex Control Center (:3000)        Amy API Bridge (:3100)        Ollama (:11434)
┌──────────────────────────┐    ┌──────────────────────────┐    ┌─────────────┐
│  Dashboard               │    │  /api/health             │    │  llama3.1   │
│  ├── Amy Intelligence    │───▶│  /api/activity           │    │  8b local   │
│  ├── Quick Actions       │    │  /api/tasks    (CRUD)    │    └──────┬──────┘
│  ├── Activity Stream     │    │  /api/approvals (A/R)    │           │
│  ├── Task Queue          │    │  /api/notifications      │           │
│  ├── Approval Gate       │    │  /api/vault/search       │           │
│  ├── Notifications       │    │  /api/neurals/status     │    ┌──────▼──────┐
│  └── Amy Chat (SSE)  ────┼───▶│                          │    │  Sovereign  │
│                          │    └──────────────────────────┘    │    Vault     │
│  /status (public)        │                                    └─────────────┘
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
| Bridge | Python REST API (:3100) |
| Streaming | Server-Sent Events (SSE) |

## Public Endpoints

| Path | Purpose |
|------|---------|
| `/status` | System health status page (GitHub-style) |
| `/api/amy/health` | JSON health check for monitoring |

## Custom Components (SSV)

| Component | Purpose | Lines |
|-----------|---------|-------|
| `amy-status-widget.tsx` | Intelligence overview + knowledge search | ~200 |
| `activity-feed.tsx` | Real-time engine event timeline | 302 |
| `task-board.tsx` | Task CRUD with status badges | 244 |
| `approval-gate.tsx` | Human-in-the-loop approvals | 234 |
| `notification-history.tsx` | Priority-styled notification panel | 248 |
| `quick-actions.tsx` | One-click operation buttons | ~200 |
| `status/page.tsx` | Public health status page | 287 |
| `api/amy/chat/route.ts` | Ollama chat + RAG | 195 |
| `api/amy/stream/route.ts` | SSE streaming endpoint | 181 |
| `api/amy/health/route.ts` | Unified health aggregator | 151 |

## Fork Info

Forked from [builderz-labs/mission-control](https://github.com/builderz-labs/mission-control) (MIT, 2K ⭐).

SSV customizations:
- Purple theme (h:270) with SSV design tokens
- Amy AI integration (chat, streaming, RAG)
- 6 custom dashboard panels
- Public status page
- Client deployment system

---

<div align="center">

**Silver Snow Vertex** — AI Operations, Sovereign & Local-first

[vertex.silversnowstudios.com](https://vertex.silversnowstudios.com)

</div>
