'use client'

import { useState, useCallback } from 'react'
import { useMissionControl } from '@/store'
import { useNavigateToPanel } from '@/lib/navigation'
import { useSmartPoll } from '@/lib/use-smart-poll'
import { SignalPill, getLocalOsStatus, getProviderHealth, getMcHealth } from './widget-primitives'
import { OnboardingChecklistWidget } from './widgets/onboarding-checklist-widget'
import { EmptyStateLaunchpad } from './empty-state-launchpad'
import { WidgetGrid } from './widget-grid'
import { AmyStatusWidget } from './amy-status-widget'
import { ActivityFeed } from './activity-feed'
import { TaskBoard } from './task-board'
import { ApprovalGate } from './approval-gate'
import { NotificationHistory } from './notification-history'
import { QuickActions } from './quick-actions'
import { KnowledgeManager } from './knowledge-manager'
import { CommandBar } from './command-bar'
import { VaultSearch } from './vault-search'
import { SystemTopology } from './system-topology'
import { SchedulerPanel } from './scheduler-panel'
import { IntelligencePanel } from './intelligence-panel'
import { CouncilChamber } from './council-chamber'
import { LogViewer } from './log-viewer'
import { CapabilityMatrix } from './capability-matrix'
import { DecisionLog } from './decision-log'
import { SessionAnalytics } from './session-analytics'
import { DashboardFooter } from './dashboard-footer'
import { AuditTrail } from './audit-trail'
import { TelegramMonitor } from './telegram-monitor'
import { NeuralRouteViz } from './neural-route-viz'
import { KeyboardShortcuts } from './keyboard-shortcuts'
import { EnvironmentInspector } from './environment-inspector'
import { ActivityHeatmap } from './activity-heatmap'
import { StorageMonitor } from './storage-monitor'
import { ModelRegistry } from './model-registry'
import { CronTimeline } from './cron-timeline'
import { ErrorTracker } from './error-tracker'
import { GitPulse } from './git-pulse'
import { UptimeMonitor } from './uptime-monitor'
import type { DbStats, ClaudeStats, LogLike, DashboardData } from './widget-primitives'

export function Dashboard() {
  const {
    sessions,
    setSessions,
    connection,
    dashboardMode,
    subscription,
    logs,
    agents,
    tasks,
    setActiveConversation,
  } = useMissionControl()

  const navigateToPanel = useNavigateToPanel()
  const isLocal = dashboardMode === 'local'

  const subscriptionLabel = subscription?.type
    ? subscription.type.charAt(0).toUpperCase() + subscription.type.slice(1)
    : null

  const SUBSCRIPTION_PRICES: Record<string, Record<string, number>> = {
    anthropic: { pro: 20, max: 100, max_5x: 200, team: 30, enterprise: 30 },
    openai: { plus: 20, chatgpt: 20, pro: 200, team: 30, enterprise: 0 },
  }

  const subscriptionPrice = subscription?.provider && subscription?.type
    ? SUBSCRIPTION_PRICES[subscription.provider]?.[subscription.type] ?? null
    : null

  const [systemStats, setSystemStats] = useState<any>(null)
  const [dbStats, setDbStats] = useState<DbStats | null>(null)
  const [claudeStats, setClaudeStats] = useState<ClaudeStats | null>(null)
  const [githubStats, setGithubStats] = useState<any>(null)
  const [hermesCronJobCount, setHermesCronJobCount] = useState(0)
  const [loading, setLoading] = useState({
    system: true,
    sessions: true,
    claude: true,
    github: true,
  })

  const loadDashboard = useCallback(async () => {
    const requests: Promise<void>[] = []

    requests.push(
      fetch('/api/status?action=dashboard')
        .then(async (res) => {
          if (!res.ok) return
          const data = await res.json()
          if (data && !data.error) {
            setSystemStats(data)
            if (data.db) setDbStats(data.db)
          }
        })
        .catch(() => {})
        .finally(() => setLoading(prev => ({ ...prev, system: false })))
    )

    requests.push(
      fetch('/api/sessions')
        .then(async (res) => {
          if (!res.ok) return
          const data = await res.json()
          if (data && !data.error) setSessions(data.sessions || data)
        })
        .catch(() => {})
        .finally(() => setLoading(prev => ({ ...prev, sessions: false })))
    )

    if (isLocal) {
      requests.push(
        fetch('/api/claude/sessions')
          .then(async (res) => {
            if (!res.ok) return
            const data = await res.json()
            if (data?.stats) setClaudeStats(data.stats)
          })
          .catch(() => {})
          .finally(() => setLoading(prev => ({ ...prev, claude: false })))
      )

      requests.push(
        fetch('/api/github?action=stats')
          .then(async (res) => {
            if (!res.ok) return
            const data = await res.json()
            if (data && !data.error) setGithubStats(data)
          })
          .catch(() => {})
          .finally(() => setLoading(prev => ({ ...prev, github: false })))
      )

      requests.push(
        fetch('/api/hermes')
          .then(async (res) => {
            if (!res.ok) return
            const data = await res.json()
            if (data?.cronJobCount != null) setHermesCronJobCount(data.cronJobCount)
          })
          .catch(() => {})
      )
    } else {
      setLoading(prev => ({ ...prev, claude: false, github: false }))
    }

    await Promise.allSettled(requests)
  }, [isLocal, setSessions])

  useSmartPoll(loadDashboard, isLocal ? 15000 : 60000, { pauseWhenConnected: true })

  // Computed values
  const isSystemLoading = loading.system && !systemStats
  const isSessionsLoading = loading.sessions && sessions.length === 0
  const isClaudeLoading = isLocal && loading.claude && !claudeStats
  const isGithubLoading = isLocal && loading.github && !githubStats

  const memPct = systemStats?.memory?.total
    ? Math.round((systemStats.memory.used / systemStats.memory.total) * 100)
    : null

  const diskPct = parseInt(systemStats?.disk?.usage || '', 10)
  const systemLoad = Math.max(memPct ?? 0, Number.isFinite(diskPct) ? diskPct : 0)

  const activeSessions = sessions.filter((s) => s.active).length
  const errorCount = logs.filter((l) => l.level === 'error').length
  const onlineAgents = dbStats
    ? dbStats.agents.total - (dbStats.agents.byStatus?.offline ?? 0)
    : agents.filter((a) => a.status !== 'offline').length

  const claudeLocalSessions = sessions.filter((s) => s.kind === 'claude-code')
  const codexLocalSessions = sessions.filter((s) => s.kind === 'codex-cli')
  const hermesLocalSessions = sessions.filter((s) => s.kind === 'hermes')
  const claudeActive = claudeLocalSessions.filter((s) => s.active).length
  const codexActive = codexLocalSessions.filter((s) => s.active).length
  const hermesActive = hermesLocalSessions.filter((s) => s.active).length

  const runningTasks = dbStats?.tasks.byStatus?.in_progress ?? tasks.filter((t) => t.status === 'in_progress').length
  const inboxCount = dbStats?.tasks.byStatus?.inbox ?? 0
  const assignedCount = dbStats?.tasks.byStatus?.assigned ?? 0
  const reviewCount = (dbStats?.tasks.byStatus?.review ?? 0) + (dbStats?.tasks.byStatus?.quality_review ?? 0)
  const doneCount = dbStats?.tasks.byStatus?.done ?? 0
  const backlogCount = inboxCount + assignedCount + reviewCount

  const localOsStatus = isSystemLoading
    ? { value: 'Loading...', status: 'warn' as const }
    : getLocalOsStatus(memPct, Number.isFinite(diskPct) ? diskPct : null)

  const claudeHealth = isClaudeLoading
    ? { value: 'Loading...', status: 'warn' as const }
    : getProviderHealth(claudeStats?.active_sessions ?? claudeActive, claudeStats?.total_sessions ?? claudeLocalSessions.length)

  const codexHealth = isSessionsLoading
    ? { value: 'Loading...', status: 'warn' as const }
    : getProviderHealth(codexActive, codexLocalSessions.length)

  const hermesHealth = isSessionsLoading
    ? { value: 'Loading...', status: 'warn' as const }
    : getProviderHealth(hermesActive, hermesLocalSessions.length)

  const mcHealth = isSystemLoading
    ? { value: 'Loading...', status: 'warn' as const }
    : getMcHealth(systemStats, dbStats, errorCount)

  const localSessionLogs: LogLike[] = isLocal
    ? sessions.reduce<LogLike[]>((acc, session) => {
        const ts = session.lastActivity || session.startTime || 0
        if (!ts) return acc

        const lastPrompt = typeof (session as any).lastUserPrompt === 'string'
          ? (session as any).lastUserPrompt.trim()
          : ''

        acc.push({
          id: `local-session-${session.id}-${ts}`,
          timestamp: ts,
          level: 'info',
          source: session.kind === 'codex-cli' ? 'codex-local' : session.kind === 'hermes' ? 'hermes-local' : 'claude-local',
          message: lastPrompt
            ? `Prompt: ${lastPrompt}`
            : `${session.active ? 'Active' : 'Idle'} session: ${session.key || session.id}`,
        })
        return acc
      }, [])
    : []

  const mergedRecentLogs: LogLike[] = (isLocal ? [...logs, ...localSessionLogs] : logs)
    .sort((a, b) => b.timestamp - a.timestamp)
    .filter((entry, index, arr) => arr.findIndex((x) => x.id === entry.id) === index)
    .slice(0, 10)

  const recentErrorLogs = mergedRecentLogs.filter((log) => log.level === 'error').length
  const gatewayHealthStatus = connection.isConnected ? 'good' as const : 'bad' as const

  const openSession = useCallback((session: any) => {
    const kind = String(session?.kind || '')
    const sid = String(session?.id || '')
    if (!sid) return
    setActiveConversation(`session:${kind}:${sid}`)
    navigateToPanel('chat')
  }, [setActiveConversation, navigateToPanel])

  const dashboardData: DashboardData = {
    isLocal,
    systemStats,
    dbStats,
    claudeStats,
    githubStats,
    loading,
    sessions,
    logs,
    agents,
    tasks,
    connection,
    subscription,
    navigateToPanel,
    openSession,
    memPct,
    diskPct,
    systemLoad,
    activeSessions,
    errorCount,
    onlineAgents,
    claudeActive,
    codexActive,
    hermesActive,
    claudeLocalSessions,
    codexLocalSessions,
    hermesLocalSessions,
    runningTasks,
    inboxCount,
    assignedCount,
    reviewCount,
    doneCount,
    backlogCount,
    mergedRecentLogs,
    recentErrorLogs,
    localOsStatus,
    claudeHealth,
    codexHealth,
    hermesHealth,
    mcHealth,
    gatewayHealthStatus,
    isSystemLoading,
    isSessionsLoading,
    isClaudeLoading,
    isGithubLoading,
    hermesCronJobCount,
    subscriptionLabel,
    subscriptionPrice,
  }

  return (
    <div className="p-5 space-y-4">
      <OnboardingChecklistWidget />
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-2xs uppercase tracking-[0.12em] text-muted-foreground">Overview</div>
            <h2 className="text-lg font-semibold text-foreground">
              {isLocal ? 'Local Agent Runtime' : 'Gateway Control Plane'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isLocal
                ? 'Unified visibility for Claude, Codex & Hermes local sessions, host pressure, and operator continuity.'
                : 'Gateway-first health, session routing, queue pressure, and incident response signals.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 min-w-[280px]">
            <SignalPill label="Mode" value={isLocal ? 'Local' : 'Gateway'} tone="info" />
            <SignalPill label="Events" value={`${mergedRecentLogs.length} stream`} tone={recentErrorLogs > 0 ? 'warning' : 'success'} />
            <SignalPill label="Queue" value={String(backlogCount)} tone={backlogCount > 10 ? 'warning' : 'info'} />
            <SignalPill label="Errors" value={String(errorCount)} tone={errorCount > 0 ? 'warning' : 'success'} />
          </div>
        </div>
      </section>

      {/* Command Bar — KPI Strip */}
      <CommandBar />

      <section className="rounded-xl border border-border bg-card p-4">
        <AmyStatusWidget />
      </section>

      {/* System Topology + Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">🗺️</span>
            <h3 className="text-sm font-semibold text-foreground">System Topology</h3>
            <span className="text-[10px] text-muted-foreground/40">Live architecture</span>
          </div>
          <div className="p-3">
            <SystemTopology />
          </div>
        </section>

        {/* Quick Actions */}
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">🎯</span>
            <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
            <span className="text-[10px] text-muted-foreground/40">One-click operations</span>
          </div>
          <div className="p-3">
            <QuickActions />
          </div>
        </section>
      </div>

      {/* Scheduler + Council Chamber */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">⏰</span>
            <h3 className="text-sm font-semibold text-foreground">Automation Scheduler</h3>
            <span className="text-[10px] text-muted-foreground/40">Amy's routines</span>
          </div>
          <div className="p-3">
            <SchedulerPanel />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">🏛️</span>
            <h3 className="text-sm font-semibold text-foreground">Council Chamber</h3>
            <span className="text-[10px] text-muted-foreground/40">Multi-model decisions</span>
          </div>
          <div className="p-3">
            <CouncilChamber />
          </div>
        </section>
      </div>

      {/* Email Lane + Intelligence Report */}
      <IntelligencePanel />

      {/* Activity Feed + Task Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">⚡</span>
            <h3 className="text-sm font-semibold text-foreground">Activity Stream</h3>
            <span className="text-[10px] text-muted-foreground/40">Live from Amy engines</span>
          </div>
          <div className="h-[400px]">
            <ActivityFeed />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">📋</span>
            <h3 className="text-sm font-semibold text-foreground">Task Queue</h3>
            <span className="text-[10px] text-muted-foreground/40">Command & Control</span>
          </div>
          <div className="h-[400px]">
            <TaskBoard />
          </div>
        </section>
      </div>

      {/* Approval Gate + Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">🔐</span>
            <h3 className="text-sm font-semibold text-foreground">Approval Gate</h3>
            <span className="text-[10px] text-muted-foreground/40">Human-in-the-loop</span>
          </div>
          <div className="h-[320px]">
            <ApprovalGate />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">🔔</span>
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            <span className="text-[10px] text-muted-foreground/40">Alerts & reports</span>
          </div>
          <div className="h-[320px]">
            <NotificationHistory />
          </div>
        </section>
      </div>

      {/* Knowledge Manager + Vault Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">📚</span>
            <h3 className="text-sm font-semibold text-foreground">Knowledge Vault</h3>
            <span className="text-[10px] text-muted-foreground/40">Browse & ingest</span>
          </div>
          <div className="p-3">
            <KnowledgeManager />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">🔮</span>
            <h3 className="text-sm font-semibold text-foreground">Vault Search</h3>
            <span className="text-[10px] text-muted-foreground/40">Neural refs & knowledge</span>
          </div>
          <div className="p-3">
            <VaultSearch />
          </div>
        </section>
      </div>

      {/* System Logs (full width) */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
          <span className="text-sm">📜</span>
          <h3 className="text-sm font-semibold text-foreground">System Logs</h3>
          <span className="text-[10px] text-muted-foreground/40">Live tail from Amy engines</span>
        </div>
        <div className="p-3">
          <LogViewer />
        </div>
      </section>

      {/* Session Analytics */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
          <span className="text-sm">📈</span>
          <h3 className="text-sm font-semibold text-foreground">Session Analytics</h3>
          <span className="text-[10px] text-muted-foreground/40">Live metrics from bridge + proxy</span>
        </div>
        <div className="p-3">
          <SessionAnalytics />
        </div>
      </section>

      {/* Capability Matrix + Decision Log */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">📊</span>
            <h3 className="text-sm font-semibold text-foreground">Capability Matrix</h3>
            <span className="text-[10px] text-muted-foreground/40">Operational maturity</span>
          </div>
          <div className="p-3">
            <CapabilityMatrix />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">📖</span>
            <h3 className="text-sm font-semibold text-foreground">Decision Log</h3>
            <span className="text-[10px] text-muted-foreground/40">58 architecture decisions</span>
          </div>
          <div className="p-3">
            <DecisionLog />
          </div>
        </section>
      </div>

      {/* Audit Trail + Telegram Monitor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">🛡️</span>
            <h3 className="text-sm font-semibold text-foreground">Audit Trail</h3>
            <span className="text-[10px] text-muted-foreground/40">Governance events</span>
          </div>
          <div className="p-3">
            <AuditTrail />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">✈️</span>
            <h3 className="text-sm font-semibold text-foreground">Telegram Monitor</h3>
            <span className="text-[10px] text-muted-foreground/40">Bot sessions + messages</span>
          </div>
          <div className="p-3">
            <TelegramMonitor />
          </div>
        </section>
      </div>

      {/* Neural Route Viz + Keyboard Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">🔀</span>
            <h3 className="text-sm font-semibold text-foreground">Neural Router</h3>
            <span className="text-[10px] text-muted-foreground/40">Cognitive routing decisions</span>
          </div>
          <div className="p-3">
            <NeuralRouteViz />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">⌨️</span>
            <h3 className="text-sm font-semibold text-foreground">Keyboard Shortcuts</h3>
            <span className="text-[10px] text-muted-foreground/40">Power user reference</span>
          </div>
          <div className="p-3">
            <KeyboardShortcuts />
          </div>
        </section>
      </div>

      {/* Environment + Activity Heatmap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">🔧</span>
            <h3 className="text-sm font-semibold text-foreground">Environment</h3>
            <span className="text-[10px] text-muted-foreground/40">System overview</span>
          </div>
          <div className="p-3">
            <EnvironmentInspector />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">🟩</span>
            <h3 className="text-sm font-semibold text-foreground">Activity Heatmap</h3>
            <span className="text-[10px] text-muted-foreground/40">90-day activity graph</span>
          </div>
          <div className="p-3">
            <ActivityHeatmap />
          </div>
        </section>
      </div>

      {/* Storage + Model Registry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">💾</span>
            <h3 className="text-sm font-semibold text-foreground">Storage</h3>
            <span className="text-[10px] text-muted-foreground/40">Disk usage breakdown</span>
          </div>
          <div className="p-3">
            <StorageMonitor />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">🤖</span>
            <h3 className="text-sm font-semibold text-foreground">Model Registry</h3>
            <span className="text-[10px] text-muted-foreground/40">Ollama AI models</span>
          </div>
          <div className="p-3">
            <ModelRegistry />
          </div>
        </section>
      </div>

      {/* Cron Timeline + Error Tracker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">⏰</span>
            <h3 className="text-sm font-semibold text-foreground">Cron Timeline</h3>
            <span className="text-[10px] text-muted-foreground/40">Scheduler routines</span>
          </div>
          <div className="p-3">
            <CronTimeline />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">⚠️</span>
            <h3 className="text-sm font-semibold text-foreground">Error Tracker</h3>
            <span className="text-[10px] text-muted-foreground/40">Cross-log error rates</span>
          </div>
          <div className="p-3">
            <ErrorTracker />
          </div>
        </section>
      </div>

      {/* Git Pulse + Uptime */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">💻</span>
            <h3 className="text-sm font-semibold text-foreground">Git Pulse</h3>
            <span className="text-[10px] text-muted-foreground/40">Repository activity</span>
          </div>
          <div className="p-3">
            <GitPulse />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <span className="text-sm">🟢</span>
            <h3 className="text-sm font-semibold text-foreground">Uptime Monitor</h3>
            <span className="text-[10px] text-muted-foreground/40">Service availability</span>
          </div>
          <div className="p-3">
            <UptimeMonitor />
          </div>
        </section>
      </div>

      <EmptyStateLaunchpad
        agentCount={dbStats?.agents.total ?? agents.length}
        taskCount={dbStats?.tasks.total ?? tasks.length}
        onNavigate={navigateToPanel}
      />

      <WidgetGrid data={dashboardData} />

      <DashboardFooter />
    </div>
  )
}
