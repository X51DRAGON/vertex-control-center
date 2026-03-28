'use client'

import { useState, useCallback } from 'react'

/**
 * QuickActions — One-click command buttons for common operations
 *
 * Gives operators instant access to critical Amy operations
 * without leaving the dashboard.
 */

type ActionResult = {
  id: string
  status: 'idle' | 'running' | 'success' | 'error'
  message?: string
}

type Action = {
  id: string
  label: string
  icon: string
  description: string
  endpoint: string
  method: 'GET' | 'POST'
  color: string
  confirmText?: string
}

const ACTIONS: Action[] = [
  {
    id: 'health',
    label: 'Health Check',
    icon: '💚',
    description: 'Run full system health scan',
    endpoint: '/api/amy/health',
    method: 'GET',
    color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40',
  },
  {
    id: 'neural-status',
    label: 'Neural Status',
    icon: '🧠',
    description: 'Check neural pipeline sync',
    endpoint: 'http://127.0.0.1:3100/api/neurals/status',
    method: 'GET',
    color: 'from-purple-500/20 to-purple-500/5 border-purple-500/20 hover:border-purple-500/40',
  },
  {
    id: 'intelligence',
    label: 'Intelligence Report',
    icon: '📊',
    description: 'Generate health intelligence',
    endpoint: 'http://127.0.0.1:3100/api/health',
    method: 'GET',
    color: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 hover:border-blue-500/40',
  },
  {
    id: 'approve-neurals',
    label: 'Approve Neurals',
    icon: '✅',
    description: 'Approve pending neural refs',
    endpoint: 'http://127.0.0.1:3100/api/neurals/approve',
    method: 'POST',
    color: 'from-green-500/20 to-green-500/5 border-green-500/20 hover:border-green-500/40',
    confirmText: 'Approve all pending neural references?',
  },
  {
    id: 'reject-neurals',
    label: 'Reject Neurals',
    icon: '❌',
    description: 'Reject pending neural batch',
    endpoint: 'http://127.0.0.1:3100/api/neurals/reject',
    method: 'POST',
    color: 'from-red-500/20 to-red-500/5 border-red-500/20 hover:border-red-500/40',
    confirmText: 'Reject all pending neural references?',
  },
  {
    id: 'new-task',
    label: 'Quick Task',
    icon: '⚡',
    description: 'Submit a new task to Amy',
    endpoint: 'http://127.0.0.1:3100/api/tasks',
    method: 'POST',
    color: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 hover:border-amber-500/40',
  },
]

export function QuickActions() {
  const [results, setResults] = useState<Record<string, ActionResult>>({})
  const [taskInput, setTaskInput] = useState('')
  const [showTaskInput, setShowTaskInput] = useState(false)

  const executeAction = useCallback(async (action: Action) => {
    // Handle confirmation
    if (action.confirmText && !window.confirm(action.confirmText)) return

    // Handle quick task input
    if (action.id === 'new-task') {
      setShowTaskInput(true)
      return
    }

    setResults(prev => ({ ...prev, [action.id]: { id: action.id, status: 'running' } }))

    try {
      const res = await fetch(action.endpoint, {
        method: action.method,
        headers: action.method === 'POST' ? { 'Content-Type': 'application/json' } : {},
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()

      // Extract a meaningful summary
      let message = 'Done'
      if (action.id === 'health') {
        message = `Score: ${data.score}% — ${data.services?.filter((s: any) => s.status === 'healthy').length}/${data.services?.length} healthy`
      } else if (action.id === 'intelligence') {
        const comps = Object.entries(data.components || {})
        const healthyCount = comps.filter(([, c]: [string, any]) => c.status === 'healthy').length
        message = `${healthyCount}/${comps.length} components healthy`
      } else if (action.id === 'neural-status') {
        message = typeof data === 'string' ? data.slice(0, 80) : JSON.stringify(data).slice(0, 80)
      } else if (data.result) {
        message = String(data.result).slice(0, 80)
      } else if (data.output) {
        message = String(data.output).slice(0, 80)
      }

      setResults(prev => ({ ...prev, [action.id]: { id: action.id, status: 'success', message } }))
    } catch (err) {
      setResults(prev => ({
        ...prev,
        [action.id]: { id: action.id, status: 'error', message: err instanceof Error ? err.message : 'Failed' },
      }))
    }

    // Clear result after 8 seconds
    setTimeout(() => {
      setResults(prev => {
        const next = { ...prev }
        delete next[action.id]
        return next
      })
    }, 8000)
  }, [])

  const submitTask = async () => {
    const description = taskInput.trim()
    if (!description) return

    setResults(prev => ({ ...prev, 'new-task': { id: 'new-task', status: 'running' } }))
    setShowTaskInput(false)
    setTaskInput('')

    try {
      const res = await fetch('http://127.0.0.1:3100/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setResults(prev => ({ ...prev, 'new-task': { id: 'new-task', status: 'success', message: `Submitted: ${description.slice(0, 50)}` } }))
    } catch (err) {
      setResults(prev => ({ ...prev, 'new-task': { id: 'new-task', status: 'error', message: 'Failed' } }))
    }

    setTimeout(() => setResults(prev => { const n = { ...prev }; delete n['new-task']; return n }), 8000)
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {ACTIONS.map(action => {
          const result = results[action.id]
          const isRunning = result?.status === 'running'

          return (
            <button
              key={action.id}
              onClick={() => executeAction(action)}
              disabled={isRunning}
              className={`relative rounded-lg border bg-gradient-to-br ${action.color} px-3 py-2.5 text-left transition-all duration-200 disabled:opacity-50 group`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{action.icon}</span>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-foreground truncate">{action.label}</div>
                  <div className="text-[9px] text-muted-foreground/50 truncate">{action.description}</div>
                </div>
              </div>

              {/* Result overlay */}
              {result && result.status !== 'idle' && (
                <div className={`absolute inset-0 rounded-lg flex items-center justify-center px-2 backdrop-blur-sm ${
                  result.status === 'running' ? 'bg-background/60' :
                  result.status === 'success' ? 'bg-green-500/10' :
                  'bg-red-500/10'
                }`}>
                  {result.status === 'running' ? (
                    <span className="text-[10px] text-muted-foreground animate-pulse">Running...</span>
                  ) : (
                    <span className={`text-[10px] ${result.status === 'success' ? 'text-green-400' : 'text-red-400'} line-clamp-2`}>
                      {result.message}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Quick task input */}
      {showTaskInput && (
        <div className="flex gap-2 mt-2 animate-in fade-in duration-200">
          <input
            value={taskInput}
            onChange={e => setTaskInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitTask(); if (e.key === 'Escape') setShowTaskInput(false) }}
            placeholder="Describe the task..."
            autoFocus
            className="flex-1 rounded-md border border-border/40 bg-surface-1 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <button
            onClick={submitTask}
            disabled={!taskInput.trim()}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            Send
          </button>
          <button
            onClick={() => setShowTaskInput(false)}
            className="text-xs text-muted-foreground/40 hover:text-muted-foreground px-2"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
