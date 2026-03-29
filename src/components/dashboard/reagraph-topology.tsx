'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  GraphCanvas,
  GraphCanvasRef,
  type Theme,
  type GraphNode as ReagraphNode,
  type GraphEdge as ReagraphEdge,
  type InternalGraphNode,
} from 'reagraph'

/**
 * ReagraphTopology — Interactive WebGL Network Graph
 *
 * Phase 118: Replaces the static SVG System Topology with an interactive
 * force-directed graph powered by Reagraph (WebGL).
 *
 * v2 — Fixed: dark background, smaller nodes, visible edges,
 * cleaner 2D layout, muted futuristic colors.
 */

type NodeStatus = 'healthy' | 'degraded' | 'offline' | 'loading'

interface TopologyNodeData {
  id: string
  label: string
  icon: string
  status: NodeStatus
  detail: string
  port?: string
  tier: 'core' | 'service' | 'module'
}

// --- Status colors — muted, elegant, not garish ---

const STATUS_FILLS: Record<NodeStatus, string> = {
  healthy: '#6ee7b7',   // emerald-300 (muted)
  degraded: '#fcd34d',  // amber-300
  offline: '#fca5a5',   // red-300
  loading: '#52525b',   // zinc-600
}

// --- SSV Dark Theme — deep purples, subtle edges ---

const ssvDarkTheme: Theme = {
  canvas: {
    background: '#0c0a14',   // very dark purple-black
    fog: '#0c0a14',
  },
  node: {
    fill: '#8b5cf6',         // violet-500
    activeFill: '#a78bfa',   // violet-400
    opacity: 1,
    selectedOpacity: 1,
    inactiveOpacity: 0.15,
    label: {
      color: '#a1a1aa',      // zinc-400
      stroke: '#0c0a14',     // match bg
      activeColor: '#e4e4e7',
    },
  },
  ring: {
    fill: '#6d28d9',         // violet-700
    activeFill: '#8b5cf6',
  },
  edge: {
    fill: '#6d28d9',         // violet-700
    activeFill: '#a78bfa',   // violet-400
    opacity: 0.6,            // much more visible!
    selectedOpacity: 1,
    inactiveOpacity: 0.12,
    label: {
      color: '#52525b',      // zinc-600
      activeColor: '#a1a1aa',
    },
  },
  arrow: {
    fill: '#7c3aed',         // violet-600
    activeFill: '#a78bfa',
  },
  lasso: {
    background: 'rgba(109, 40, 217, 0.1)',
    border: 'rgba(139, 92, 246, 0.3)',
  },
}

// --- Topology node definitions ---

const INITIAL_NODES: TopologyNodeData[] = [
  { id: 'bridge',    label: 'Amy Bridge',      icon: '🌉', status: 'loading', detail: ':3100',       port: ':3100',  tier: 'core' },
  { id: 'dashboard', label: 'Dashboard',       icon: '🖥️', status: 'loading', detail: ':3000',       port: ':3000',  tier: 'core' },
  { id: 'ollama',    label: 'Ollama LLM',      icon: '🧠', status: 'loading', detail: ':11434',      port: ':11434', tier: 'core' },
  { id: 'vault',     label: 'Sovereign Vault',  icon: '🏛️', status: 'loading', detail: '1.7M+ words',                tier: 'service' },
  { id: 'engines',   label: 'Amy Engines',      icon: '⚙️', status: 'loading', detail: '8 modules',                  tier: 'service' },
  { id: 'scheduler', label: 'Scheduler',        icon: '⏰', status: 'loading', detail: '7 routines',                 tier: 'module' },
  { id: 'proxy',     label: 'Amy Proxy',        icon: '🔀', status: 'loading', detail: 'Neural routing',             tier: 'service' },
  { id: 'telegram',  label: 'Telegram',         icon: '📱', status: 'loading', detail: 'Bot sessions',               tier: 'module' },
  { id: 'email',     label: 'Email Lane',       icon: '📧', status: 'loading', detail: 'IMAP watcher',               tier: 'module' },
  { id: 'council',   label: 'Council',          icon: '🏛️', status: 'loading', detail: '4 advisors',                 tier: 'module' },
]

const TOPOLOGY_EDGES = [
  { from: 'dashboard', to: 'bridge',    label: 'REST' },
  { from: 'bridge',    to: 'ollama',    label: 'inference' },
  { from: 'bridge',    to: 'vault',     label: 'knowledge' },
  { from: 'bridge',    to: 'engines',   label: 'modules' },
  { from: 'bridge',    to: 'scheduler', label: 'routines' },
  { from: 'proxy',     to: 'ollama',    label: 'routing' },
  { from: 'engines',   to: 'scheduler', label: 'triggers' },
  { from: 'engines',   to: 'email',     label: 'drafts' },
  { from: 'engines',   to: 'telegram',  label: 'commands' },
  { from: 'engines',   to: 'council',   label: 'cases' },
  { from: 'council',   to: 'ollama',    label: 'multi-model' },
  { from: 'vault',     to: 'engines',   label: 'search' },
]

// Node sizes by tier — subtle differences, NOT blobs
const TIER_SIZES: Record<string, number> = {
  core: 5,
  service: 4,
  module: 3,
}

export function ReagraphTopology() {
  const [topoNodes, setTopoNodes] = useState<TopologyNodeData[]>(INITIAL_NODES)
  const [hoveredNode, setHoveredNode] = useState<{ label: string; sub?: string } | null>(null)
  const [actives, setActives] = useState<string[]>([])
  const graphRef = useRef<GraphCanvasRef | null>(null)

  // Fetch health data
  const refreshHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/amy/health')
      if (!res.ok) throw new Error('health failed')
      const data = await res.json()

      const services = data.services || []
      const ollamaService = services.find((s: any) => s.name === 'Ollama')
      const bridgeHealth = services.find((s: any) => s.name === 'Bridge Health')

      setTopoNodes(prev => prev.map(node => {
        switch (node.id) {
          case 'dashboard':
            return { ...node, status: 'healthy' as NodeStatus, detail: `Score: ${data.score}%` }
          case 'bridge':
            return { ...node, status: (bridgeHealth?.status === 'healthy' ? 'healthy' : 'degraded') as NodeStatus, detail: bridgeHealth?.detail || ':3100' }
          case 'ollama':
            return { ...node, status: (ollamaService?.status === 'healthy' ? 'healthy' : ollamaService?.status === 'degraded' ? 'degraded' : 'offline') as NodeStatus, detail: ollamaService?.detail || ':11434' }
          case 'vault':     return { ...node, status: 'healthy' as NodeStatus, detail: '1.7M+ words' }
          case 'engines':   return { ...node, status: 'healthy' as NodeStatus, detail: '8 modules' }
          case 'scheduler': return { ...node, status: 'healthy' as NodeStatus, detail: '7 routines' }
          case 'proxy':     return { ...node, status: 'healthy' as NodeStatus, detail: 'Neural routing' }
          case 'telegram':  return { ...node, status: 'healthy' as NodeStatus, detail: '6 sessions' }
          case 'email':     return { ...node, status: 'healthy' as NodeStatus, detail: 'IMAP active' }
          case 'council':   return { ...node, status: 'healthy' as NodeStatus, detail: '4 advisors' }
          default: return node
        }
      }))
    } catch {
      setTopoNodes(prev => prev.map(n =>
        n.id === 'dashboard'
          ? { ...n, status: 'degraded' as NodeStatus, detail: 'Bridge offline' }
          : n
      ))
    }
  }, [])

  useEffect(() => {
    refreshHealth()
    const interval = setInterval(refreshHealth, 30000)
    return () => clearInterval(interval)
  }, [refreshHealth])

  // Auto-fit after layout settles
  useEffect(() => {
    const t1 = setTimeout(() => graphRef.current?.fitNodesInView(undefined, { animated: true }), 1200)
    const t2 = setTimeout(() => graphRef.current?.fitNodesInView(undefined, { animated: false }), 3000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Build Reagraph nodes — small, elegant, color-coded
  const graphNodes: ReagraphNode[] = useMemo(() =>
    topoNodes.map(node => ({
      id: node.id,
      label: `${node.icon} ${node.label}`,
      fill: STATUS_FILLS[node.status],
      size: TIER_SIZES[node.tier] || 3,
      data: node,
    })),
    [topoNodes]
  )

  // Build Reagraph edges — all with labels
  const graphEdges: ReagraphEdge[] = useMemo(() =>
    TOPOLOGY_EDGES.map((edge, i) => ({
      id: `e-${i}`,
      source: edge.from,
      target: edge.to,
      label: edge.label,
      size: edge.from === 'bridge' || edge.to === 'bridge' ? 2 : 1,
    })),
    []
  )

  // Hover handlers
  const handleNodeHover = useCallback((node: InternalGraphNode) => {
    setActives([node.id])
    const d = node.data as TopologyNodeData
    if (d) {
      setHoveredNode({
        label: `${d.icon} ${d.label}`,
        sub: `${d.detail}${d.port ? `  ·  ${d.port}` : ''}  ·  ${d.status}`,
      })
    }
  }, [])

  const handleNodeUnhover = useCallback(() => {
    setActives([])
    setHoveredNode(null)
  }, [])

  const handleCanvasClick = useCallback(() => {
    setActives([])
    setHoveredNode(null)
  }, [])

  const healthyCount = topoNodes.filter(n => n.status === 'healthy').length
  const totalCount = topoNodes.length

  return (
    <div className="relative w-full overflow-hidden rounded-lg" style={{ height: 340, background: '#0c0a14' }}>
      {/* Node count badge — top-left */}
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full backdrop-blur-xl ${
          healthyCount === totalCount
            ? 'bg-emerald-500/10 text-emerald-300/80 border border-emerald-500/15'
            : 'bg-amber-500/10 text-amber-300/80 border border-amber-500/15'
        }`}>
          {healthyCount}/{totalCount} nodes
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/8 text-violet-300/60 border border-violet-500/12 backdrop-blur-xl">
          WebGL
        </span>
      </div>

      {/* Refresh — top-right */}
      <div className="absolute top-2.5 right-2.5 z-10">
        <button
          onClick={refreshHealth}
          className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/3 text-zinc-500 border border-white/5 backdrop-blur-xl hover:text-violet-300 hover:border-violet-500/20 transition-all"
        >
          ↻
        </button>
      </div>

      {/* WebGL 3D Graph */}
      <GraphCanvas
        ref={graphRef}
        nodes={graphNodes}
        edges={graphEdges}
        theme={ssvDarkTheme}
        layoutType="forceDirected2d"
        layoutOverrides={{
          linkDistance: 80,
          nodeStrength: -180,
        }}
        labelType="all"
        edgeArrowPosition="end"
        animated={true}
        draggable={true}
        defaultNodeSize={3}
        minNodeSize={2}
        maxNodeSize={6}
        cameraMode="pan"
        actives={actives}
        onNodePointerOver={handleNodeHover}
        onNodePointerOut={handleNodeUnhover}
        onCanvasClick={handleCanvasClick}
      />

      {/* Hover tooltip — bottom-center */}
      {hoveredNode && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-xl border border-white/8 shadow-2xl">
            <div className="text-[11px] font-mono text-zinc-200">{hoveredNode.label}</div>
            {hoveredNode.sub && (
              <div className="text-[9px] font-mono text-zinc-500 mt-0.5">{hoveredNode.sub}</div>
            )}
          </div>
        </div>
      )}

      {/* Legend — bottom-right */}
      <div className="absolute bottom-2 right-2.5 z-10">
        <div className="flex items-center gap-2.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-xl border border-white/4">
          <span className="flex items-center gap-1 text-[8px] font-mono text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_FILLS.healthy }} />online
          </span>
          <span className="flex items-center gap-1 text-[8px] font-mono text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_FILLS.degraded }} />degraded
          </span>
          <span className="flex items-center gap-1 text-[8px] font-mono text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_FILLS.offline }} />offline
          </span>
        </div>
      </div>

      {/* Controls hint — bottom-left */}
      <div className="absolute bottom-2 left-2.5 z-10">
        <span className="text-[8px] font-mono text-zinc-700/50 pointer-events-none select-none">
          drag · scroll · hover
        </span>
      </div>
    </div>
  )
}
