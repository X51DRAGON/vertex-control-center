'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * ConfigViewer — Platform configuration overview
 */

type ConfigFile = {
  name: string; type: string; keys: number; size: number
  preview: Record<string, string>
}

export function ConfigViewer() {
  const [configs, setConfigs] = useState<ConfigFile[]>([])
  const [engineModules, setEngineModules] = useState<string[]>([])
  const [serviceFiles, setServiceFiles] = useState<string[]>([])
  const [testSuites, setTestSuites] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('http://127.0.0.1:3100/api/config')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setConfigs(data.configs || [])
      setEngineModules(data.engineModules || [])
      setServiceFiles(data.serviceFiles || [])
      setTestSuites(data.testSuites || [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="h-32 rounded-lg bg-surface-1/30 animate-pulse" />

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-bold text-primary">{engineModules.length}</span>
          <span className="text-[9px] text-muted-foreground/30">engines</span>
        </div>
        <div className="h-3 w-px bg-border/20" />
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-foreground">{serviceFiles.length}</span>
          <span className="text-[9px] text-muted-foreground/30">services</span>
        </div>
        <div className="h-3 w-px bg-border/20" />
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-foreground">{testSuites.length}</span>
          <span className="text-[9px] text-muted-foreground/30">tests</span>
        </div>
        <div className="h-3 w-px bg-border/20" />
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-foreground">{configs.length}</span>
          <span className="text-[9px] text-muted-foreground/30">configs</span>
        </div>
      </div>

      {/* Config files */}
      <div className="space-y-1">
        {configs.map(c => (
          <div key={c.name} className="rounded-md border border-border/10 bg-surface-1/10 p-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px]">{c.type === 'json' ? '📋' : '🐍'}</span>
                <span className="text-[9px] font-mono font-medium text-foreground/50">{c.name}</span>
              </div>
              <span className="text-[7px] text-muted-foreground/20">{c.keys} keys · {(c.size / 1024).toFixed(1)}KB</span>
            </div>
            {Object.entries(c.preview).slice(0, 3).map(([k, v]) => (
              <div key={k} className="text-[7px] text-muted-foreground/20 font-mono truncate pl-4">
                {k}: <span className="text-primary/30">{String(v)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Engine modules grid */}
      <div>
        <div className="text-[8px] text-muted-foreground/25 mb-1">Engine modules</div>
        <div className="flex flex-wrap gap-1">
          {engineModules.map(m => (
            <span key={m} className="text-[7px] font-mono bg-primary/10 text-primary/50 px-1.5 py-0.5 rounded">
              {m.replace('amy_', '').replace('.py', '')}
            </span>
          ))}
        </div>
      </div>

      {/* Services */}
      <div>
        <div className="text-[8px] text-muted-foreground/25 mb-1">Services</div>
        <div className="flex flex-wrap gap-1">
          {serviceFiles.map(s => (
            <span key={s} className="text-[7px] font-mono bg-emerald-500/10 text-emerald-400/50 px-1.5 py-0.5 rounded">
              {s.replace('amy-', '').replace('.py', '')}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
