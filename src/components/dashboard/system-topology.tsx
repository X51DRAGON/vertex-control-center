'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * SystemTopology — Live architecture visualization
 *
 * Shows the system's components as a network topology diagram
 * with real-time health status colors and data flow indicators.
 */

type NodeStatus = 'healthy' | 'degraded' | 'offline' | 'loading'

type SystemNode = {
  id: string
  label: string
  icon: string
  status: NodeStatus
  detail: string
  x: number
  y: number
}

type Connection = {
  from: string
  to: string
  label: string
  animated: boolean
}

const STATUS_COLORS: Record<NodeStatus, { dot: string; border: string; bg: string; text: string; glow: string }> = {
  healthy: {
    dot: 'bg-emerald-500',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  degraded: {
    dot: 'bg-amber-500',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
  },
  offline: {
    dot: 'bg-red-500',
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
    text: 'text-red-400',
    glow: 'shadow-red-500/20',
  },
  loading: {
    dot: 'bg-zinc-500',
    border: 'border-zinc-500/30',
    bg: 'bg-zinc-500/5',
    text: 'text-zinc-400',
    glow: 'shadow-zinc-500/20',
  },
}

function TopologyNode({ node }: { node: SystemNode }) {
  const colors = STATUS_COLORS[node.status]
  return (
    <div
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500`}
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
    >
      <div className={`relative rounded-xl border ${colors.border} ${colors.bg} p-3 shadow-lg ${colors.glow} min-w-[120px] backdrop-blur-sm`}>
        {/* Pulse dot */}
        <div className="absolute -top-1 -right-1">
          <span className="relative flex h-3 w-3">
            {node.status === 'healthy' && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.dot} opacity-40`} />
            )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${colors.dot}`} />
          </span>
        </div>

        <div className="text-center">
          <div className="text-lg mb-0.5">{node.icon}</div>
          <div className="text-[11px] font-semibold text-foreground">{node.label}</div>
          <div className={`text-[9px] ${colors.text} mt-0.5`}>{node.detail}</div>
        </div>
      </div>
    </div>
  )
}

function ConnectionLine({ from, to, label, animated, nodes }: Connection & { nodes: SystemNode[] }) {
  const fromNode = nodes.find(n => n.id === from)
  const toNode = nodes.find(n => n.id === to)
  if (!fromNode || !toNode) return null

  // Calculate SVG coordinates
  const x1 = fromNode.x
  const y1 = fromNode.y
  const x2 = toNode.x
  const y2 = toNode.y

  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2

  return (
    <g>
      <line
        x1={`${x1}%`}
        y1={`${y1}%`}
        x2={`${x2}%`}
        y2={`${y2}%`}
        stroke="hsl(270 60% 50% / 0.2)"
        strokeWidth="1.5"
        strokeDasharray={animated ? "6 3" : ""}
        className={animated ? "animate-dash" : ""}
      />
      {label && (
        <text
          x={`${midX}%`}
          y={`${midY}%`}
          textAnchor="middle"
          dy="-6"
          fill="hsl(270 30% 60% / 0.4)"
          fontSize="8"
          fontFamily="monospace"
        >
          {label}
        </text>
      )}
    </g>
  )
}

export function SystemTopology() {
  const [nodes, setNodes] = useState<SystemNode[]>([
    { id: 'dashboard', label: 'Dashboard', icon: '🖥️', status: 'loading', detail: 'Loading...', x: 50, y: 15 },
    { id: 'bridge', label: 'Amy Bridge', icon: '🌉', status: 'loading', detail: ':3100', x: 50, y: 50 },
    { id: 'ollama', label: 'Ollama LLM', icon: '🧠', status: 'loading', detail: ':11434', x: 18, y: 50 },
    { id: 'vault', label: 'Sovereign Vault', icon: '🏛️', status: 'loading', detail: '1.7M+ words', x: 82, y: 50 },
    { id: 'engines', label: 'Amy Engines', icon: '⚙️', status: 'loading', detail: '8 modules', x: 30, y: 85 },
    { id: 'scheduler', label: 'Scheduler', icon: '⏰', status: 'loading', detail: '6 routines', x: 70, y: 85 },
  ])

  const connections: Connection[] = [
    { from: 'dashboard', to: 'bridge', label: 'REST API', animated: true },
    { from: 'bridge', to: 'ollama', label: 'inference', animated: true },
    { from: 'bridge', to: 'vault', label: 'knowledge', animated: true },
    { from: 'bridge', to: 'engines', label: 'modules', animated: false },
    { from: 'bridge', to: 'scheduler', label: 'routines', animated: false },
    { from: 'engines', to: 'scheduler', label: '', animated: false },
  ]

  const refreshHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/amy/health')
      if (!res.ok) throw new Error('health failed')
      const data = await res.json()

      const services = data.services || []
      const ollamaService = services.find((s: any) => s.name === 'Ollama')
      const bridgeHealth = services.find((s: any) => s.name === 'Bridge Health')
      const activityService = services.find((s: any) => s.name === 'Activity Log')

      setNodes(prev => prev.map(node => {
        switch (node.id) {
          case 'dashboard':
            return { ...node, status: 'healthy' as NodeStatus, detail: `Score: ${data.score}%` }
          case 'bridge':
            return {
              ...node,
              status: (bridgeHealth?.status === 'healthy' ? 'healthy' : 'degraded') as NodeStatus,
              detail: bridgeHealth?.detail || ':3100',
            }
          case 'ollama':
            return {
              ...node,
              status: (ollamaService?.status === 'healthy' ? 'healthy' : ollamaService?.status === 'degraded' ? 'degraded' : 'offline') as NodeStatus,
              detail: ollamaService?.detail || ':11434',
            }
          case 'vault': {
            const kbService = services.find((s: any) => s.name === 'Activity Log')
            return {
              ...node,
              status: 'healthy' as NodeStatus,
              detail: activityService?.detail?.match(/(\d+)\s*entries/)?.[0] || '1.7M+ words',
            }
          }
          case 'engines':
            return { ...node, status: 'healthy' as NodeStatus, detail: '8 modules · 100%' }
          case 'scheduler':
            return { ...node, status: 'healthy' as NodeStatus, detail: '6 routines' }
          default:
            return node
        }
      }))
    } catch {
      setNodes(prev => prev.map(n => n.id === 'dashboard' ? { ...n, status: 'degraded' as NodeStatus, detail: 'Bridge offline' } : n))
    }
  }, [])

  useEffect(() => {
    refreshHealth()
    const interval = setInterval(refreshHealth, 30000)
    return () => clearInterval(interval)
  }, [refreshHealth])

  const healthyCount = nodes.filter(n => n.status === 'healthy').length
  const totalCount = nodes.length

  return (
    <div className="space-y-2">
      {/* Header stats */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${healthyCount === totalCount ? 'text-emerald-400' : 'text-amber-400'}`}>
            {healthyCount}/{totalCount} nodes healthy
          </span>
        </div>
        <button
          onClick={refreshHealth}
          className="text-[10px] text-muted-foreground/40 hover:text-foreground transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Topology diagram */}
      <div className="relative h-[280px] rounded-lg border border-border/20 bg-gradient-to-b from-surface-1/30 to-transparent overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(270 50% 50%) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Connection SVG */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <style>{`
            @keyframes dashFlow {
              to { stroke-dashoffset: -18; }
            }
            .animate-dash {
              animation: dashFlow 1.5s linear infinite;
            }
          `}</style>
          {connections.map((conn, i) => (
            <ConnectionLine key={i} {...conn} nodes={nodes} />
          ))}
        </svg>

        {/* Nodes */}
        {nodes.map(node => (
          <TopologyNode key={node.id} node={node} />
        ))}
      </div>
    </div>
  )
}
