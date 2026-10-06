import React from 'react';
import { Plane, Radio, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  connected: boolean;
  tick: number;
  running: boolean;
  crashedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  connected,
  tick,
  running,
  crashedCount,
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between border-b border-radar-border bg-radar-panel px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-radar-cyan/10 border border-radar-cyan/30 text-radar-cyan">
          <Plane className="h-6 w-6 transform -rotate-45" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-wider text-slate-100">
              AIRPORT ATC SIMULATION SYSTEM
            </h1>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-700">
              v2.1 CLOUD RUN
            </span>
          </div>
          <p className="text-xs text-slate-400">
            실시간 공항 이착륙 관제 시뮬레이터 (Spring Boot + React + STOMP)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Crash alert pill if any */}
        {crashedCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-1.5 text-xs text-red-400 animate-pulse">
            <ShieldAlert className="h-4 w-4" />
            <span>추락 사고: <strong>{crashedCount}</strong>건</span>
          </div>
        )}

        {/* Status Pill */}
        <div className="flex items-center gap-2 rounded-lg border border-radar-border bg-slate-900/80 px-3 py-1.5 text-xs">
          <span className="text-slate-400">상태:</span>
          {running ? (
            <span className="font-semibold text-radar-green flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-radar-green animate-ping inline-block" />
              RUNNING
            </span>
          ) : (
            <span className="font-semibold text-radar-amber">PAUSED</span>
          )}
        </div>

        {/* WebSocket Connection Pill */}
        <div className="flex items-center gap-2 rounded-lg border border-radar-border bg-slate-900/80 px-3 py-1.5 text-xs">
          <Radio className={`h-3.5 w-3.5 ${connected ? 'text-radar-green' : 'text-radar-red animate-pulse'}`} />
          <span className={connected ? 'text-emerald-400' : 'text-rose-400'}>
            {connected ? 'WS CONNECTED' : 'WS RECONNECTING...'}
          </span>
        </div>

        {/* Current Tick */}
        <div className="rounded-lg border border-radar-cyan/30 bg-radar-cyan/10 px-3 py-1.5 text-xs font-mono">
          <span className="text-slate-400 mr-2">TICK</span>
          <span className="text-radar-cyan font-bold text-sm">#{tick}</span>
        </div>
      </div>
    </header>
  );
};
