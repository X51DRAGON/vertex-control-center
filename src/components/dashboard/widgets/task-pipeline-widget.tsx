'use client'

import type { DashboardData } from '../widget-primitives'

interface PipelineStage {
  label: string
  count: number
  color: string
  bgColor: string
}

export function TaskPipelineWidget({ data }: { data: DashboardData }) {
  const { inboxCount, assignedCount, runningTasks, reviewCount, doneCount, navigateToPanel } = data

  const total = inboxCount + assignedCount + runningTasks + reviewCount + doneCount

  const stages: PipelineStage[] = [
    { label: 'Inbox', count: inboxCount, color: 'text-zinc-400', bgColor: 'bg-zinc-500' },
    { label: 'Assigned', count: assignedCount, color: 'text-blue-400', bgColor: 'bg-blue-500' },
    { label: 'Running', count: runningTasks, color: 'text-amber-400', bgColor: 'bg-amber-500' },
    { label: 'Review', count: reviewCount, color: 'text-purple-400', bgColor: 'bg-purple-500' },
    { label: 'Done', count: doneCount, color: 'text-green-400', bgColor: 'bg-green-500' },
  ]

  // Highlight bottlenecks: any non-terminal stage with more items than the next stage
  const hasBottleneck = reviewCount > 3

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="text-sm font-semibold">Task Pipeline</h3>
        <span className="text-2xs text-muted-foreground font-mono-tight">{total} total</span>
      </div>
      <div
        className="panel-body cursor-pointer hover:bg-secondary/20 transition-smooth rounded-b-lg"
        onClick={() => navigateToPanel('tasks')}
      >
        {/* Stage labels with counts */}
        <div className="flex items-center justify-between mb-2">
          {stages.map((stage, i) => (
            <div key={stage.label} className="flex items-center gap-1">
              <span className={`text-2xs font-medium ${stage.count > 0 ? stage.color : 'text-muted-foreground/40'}`}>
                {stage.label}
              </span>
              <span className={`text-2xs font-mono-tight ${stage.count > 0 ? 'text-foreground/70' : 'text-muted-foreground/30'}`}>
                ({stage.count})
              </span>
              {i < stages.length - 1 && (
                <span className="text-muted-foreground/20 mx-1">→</span>
              )}
            </div>
          ))}
        </div>

        {/* Pipeline bar */}
        <div className="h-2 rounded-full bg-secondary overflow-hidden flex">
          {total === 0 ? (
            <div className="w-full h-full bg-secondary" />
          ) : (
            stages.map((stage) =>
              stage.count > 0 ? (
                <div
                  key={stage.label}
                  className={`h-full ${stage.bgColor} ${
                    stage.label === 'Review' && hasBottleneck ? 'animate-pulse' : ''
                  } transition-all duration-500`}
                  style={{ width: `${(stage.count / total) * 100}%` }}
                />
              ) : null
            )
          )}
        </div>

        {/* Bottleneck warning */}
        {hasBottleneck && (
          <p className="text-2xs text-amber-400/80 mt-2">
            Review pile-up: {reviewCount} tasks waiting for review
          </p>
        )}
      </div>
    </div>
  )
}
