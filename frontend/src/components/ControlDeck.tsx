import React from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  AlertTriangle, 
  PlaneTakeoff, 
  PlusCircle, 
  SlidersHorizontal,
  CheckCircle2
} from 'lucide-react';
import { SimulationConfig } from '../types';

interface ControlDeckProps {
  config: SimulationConfig;
  onStart: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onToggleMutex: (enabled: boolean) => void;
  onSpawnEmergency: () => void;
  onSpawnTakeoff: () => void;
  onOpenAddRunway: () => void;
}

export const ControlDeck: React.FC<ControlDeckProps> = ({
  config,
  onStart,
  onPause,
  onStep,
  onReset,
  onSpeedChange,
  onToggleMutex,
  onSpawnEmergency,
  onSpawnTakeoff,
  onOpenAddRunway,
}) => {
  return (
    <div className="rounded-xl border border-radar-border bg-radar-panel p-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* 1. 시뮬레이션 기본 제어 버튼군 */}
        <div className="flex items-center gap-2">
          {config.running ? (
            <button
              onClick={onPause}
              className="flex items-center gap-2 rounded-lg bg-amber-500/20 border border-amber-500/40 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition shadow-sm"
            >
              <Pause className="h-4 w-4" />
              PAUSE (일시정지)
            </button>
          ) : (
            <button
              onClick={onStart}
              className="flex items-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition shadow-sm"
            >
              <Play className="h-4 w-4" />
              START (시작)
            </button>
          )}

          <button
            onClick={onStep}
            disabled={config.running}
            className="flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-40 transition"
          >
            <SkipForward className="h-4 w-4 text-radar-cyan" />
            STEP (1틱 진행)
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-500/40 transition"
          >
            <RotateCcw className="h-4 w-4" />
            RESET (초기화)
          </button>
        </div>

        {/* 2. 틱 속도 제어 슬라이더 */}
        <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
          <SlidersHorizontal className="h-3.5 w-3.5 text-radar-dim" />
          <span className="text-slate-400">속도:</span>
          <input
            type="range"
            min="200"
            max="2000"
            step="100"
            value={config.tickIntervalMs}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="h-1.5 w-24 accent-radar-cyan cursor-pointer"
          />
          <span className="text-radar-cyan font-mono w-14 text-right">
            {(config.tickIntervalMs / 1000).toFixed(1)}s
          </span>
        </div>

        {/* 3. [확장 1단계] X자 교차 상호배제(Mutex) 토글 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleMutex(!config.xCrossingMutexEnabled)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              config.xCrossingMutexEnabled
                ? 'border-indigo-500/40 bg-indigo-950/40 text-indigo-300'
                : 'border-slate-700 bg-slate-900 text-slate-400'
            }`}
          >
            {config.xCrossingMutexEnabled ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
            ) : (
              <span className="h-2 w-2 rounded-full bg-slate-600 inline-block" />
            )}
            X-교차 상호배제: {config.xCrossingMutexEnabled ? '활성 (MUTEX ON)' : '비활성 (MUTEX OFF)'}
          </button>
        </div>

        {/* 4. [확장 2단계] 수동 편대 투입 & 활주로 추가 */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSpawnEmergency}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-900/40 transition"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
            비상기 수동 스폰 (연료 0)
          </button>

          <button
            onClick={onSpawnTakeoff}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
          >
            <PlaneTakeoff className="h-3.5 w-3.5 text-emerald-400" />
            이륙기 추가
          </button>

          <button
            onClick={onOpenAddRunway}
            className="flex items-center gap-1.5 rounded-lg border border-radar-cyan/40 bg-radar-cyan/10 px-3 py-1.5 text-xs font-medium text-radar-cyan hover:bg-radar-cyan/20 transition"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            활주로 추가
          </button>
        </div>
      </div>
    </div>
  );
};
