'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * ActivityHeatmap — GitHub-style activity graph
 *
 * Shows 90 days of system activity parsed from logs.
 * Each cell is a day, color intensity = activity level.
 */

type HeatmapDay = {
  date: string
  count: number
  weekday: number
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getIntensity(count: number, max: number): string {
  if (count === 0) return 'bg-surface-1/20'
  const ratio = count / max
  if (ratio < 0.1) return 'bg-primary/15'
  if (ratio < 0.3) return 'bg-primary/30'
  if (ratio < 0.6) return 'bg-primary/50'
  return 'bg-primary/80'
}

export function ActivityHeatmap() {
  const [days, setDays] = useState<HeatmapDay[]>([])
  const [maxCount, setMaxCount] = useState(1)
  const [totalActivity, setTotalActivity] = useState(0)
  const [activeDays, setActiveDays] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('http://127.0.0.1:3100/api/heatmap')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setDays(data.days || [])
      setMaxCount(data.maxCount || 1)
      setTotalActivity(data.totalActivity || 0)
      setActiveDays(data.activeDays || 0)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return <div className="h-32 rounded-lg bg-surface-1/30 animate-pulse" />
  }

  // Group into weeks (columns)
  const weeks: HeatmapDay[][] = []
  let currentWeek: HeatmapDay[] = []
  days.forEach(d => {
    if (d.weekday === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    currentWeek.push(d)
  })
  if (currentWeek.length > 0) weeks.push(currentWeek)

  // Get month labels
  const monthLabels: { label: string; col: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, i) => {
    const firstDay = week[0]
    const month = new Date(firstDay.date).getMonth()
    if (month !== lastMonth) {
      monthLabels.push({ label: MONTHS[month], col: i })
      lastMonth = month
    }
  })

  return (
    <div className="space-y-2">
      {/* Stats */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-primary">{(totalActivity / 1000).toFixed(1)}K</span>
          <span className="text-[9px] text-muted-foreground/30">events</span>
        </div>
        <div className="h-3 w-px bg-border/20" />
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-foreground">{activeDays}</span>
          <span className="text-[9px] text-muted-foreground/30">active days</span>
        </div>
        <div className="h-3 w-px bg-border/20" />
        <span className="text-[9px] text-muted-foreground/20">last 90 days</span>
      </div>

      {/* Month labels */}
      <div className="flex gap-[2px] ml-6">
        {monthLabels.map((ml, i) => (
          <div
            key={i}
            className="text-[7px] text-muted-foreground/25"
            style={{ marginLeft: i === 0 ? 0 : `${(ml.col - (monthLabels[i - 1]?.col || 0) - 1) * 10}px` }}
          >
            {ml.label}
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="flex items-start gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[2px] pt-0">
          {['M', '', 'W', '', 'F', '', 'S'].map((label, i) => (
            <div key={i} className="h-[8px] text-[6px] text-muted-foreground/20 leading-[8px] w-4 text-right pr-1">
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-[2px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {/* Pad incomplete first week */}
              {wi === 0 && Array.from({ length: week[0].weekday }).map((_, i) => (
                <div key={`pad-${i}`} className="w-[8px] h-[8px]" />
              ))}
              {week.map((day, di) => (
                <div
                  key={di}
                  className={`w-[8px] h-[8px] rounded-[1px] ${getIntensity(day.count, maxCount)} transition-all cursor-pointer hover:ring-1 hover:ring-primary/50`}
                  title={`${day.date}: ${day.count.toLocaleString()} events`}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredDay && (
        <div className="text-[9px] text-muted-foreground/40">
          <span className="text-foreground/60 font-medium">{hoveredDay.date}</span>
          <span className="mx-1">·</span>
          <span className="text-primary">{hoveredDay.count.toLocaleString()}</span> events
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-1.5 justify-end">
        <span className="text-[7px] text-muted-foreground/20">Less</span>
        <div className="w-[8px] h-[8px] rounded-[1px] bg-surface-1/20" />
        <div className="w-[8px] h-[8px] rounded-[1px] bg-primary/15" />
        <div className="w-[8px] h-[8px] rounded-[1px] bg-primary/30" />
        <div className="w-[8px] h-[8px] rounded-[1px] bg-primary/50" />
        <div className="w-[8px] h-[8px] rounded-[1px] bg-primary/80" />
        <span className="text-[7px] text-muted-foreground/20">More</span>
      </div>
    </div>
  )
}
