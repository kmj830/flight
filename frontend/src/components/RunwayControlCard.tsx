import React from 'react';
import { 
  ShieldCheck, 
  Ban, 
  Star, 
  Compass, 
  PlaneLanding, 
  PlaneTakeoff
} from 'lucide-react';
import { RunwayDto } from '../types';

interface RunwayControlCardProps {
  runway: RunwayDto;
  isEmergencyRunway: boolean;
  onToggleClosure: (id: number) => void;
  onToggleDirection: (id: number, op: 'LANDING' | 'TAKEOFF') => void;
  onSetEmergency: (id: number) => void;
}

export const RunwayControlCard: React.FC<RunwayControlCardProps> = ({
  runway,
  isEmergencyRunway,
  onToggleClosure,
  onToggleDirection,
  onSetEmergency,
}) => {
  return (
    <div
      className={`rounded-xl border p-3.5 transition shadow-lg ${
        runway.isClosed
          ? 'border-rose-900/60 bg-rose-950/20'
          : isEmergencyRunway
          ? 'border-amber-500/40 bg-amber-950/10'
          : 'border-radar-border bg-radar-panel'
      }`}
    >
      {/* Top row: Name & Badges */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-xs font-bold text-radar-cyan font-mono border border-slate-700">
            {runway.id}
          </span>
          <h3 className="text-xs font-bold text-slate-100 truncate">
            {runway.name}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {isEmergencyRunway && (
            <span className="flex items-center gap-1 rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
              <Star className="h-3 w-3 fill-amber-300" />
              비상 활주로
            </span>
          )}
          <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            {runway.type}
          </span>
        </div>
      </div>

      {/* Current flight / status row */}
      <div className="mb-3 rounded-lg border border-slate-800/80 bg-slate-900/70 p-2 text-xs">
        <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
          <span>작업 상태:</span>
          <span className={runway.isClosed ? 'text-rose-400 font-bold' : 'text-slate-300'}>
            {runway.isClosed ? '폐쇄됨 (CLOSED)' : (runway.currentFlight ? '사용 중 (IN USE)' : '대기 (IDLE)')}
          </span>
        </div>
        <div className="font-mono text-xs text-slate-200 truncate">
          {runway.lastOperation}
        </div>
        {runway.crossingRunwayId && (
          <div className="mt-1 text-[10px] text-indigo-400 flex items-center gap-1">
            <Compass className="h-3 w-3" />
            활주로 {runway.crossingRunwayId}번과 X자 교차 상호배제 연동
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* 폐쇄/재개 버튼 */}
        <button
          onClick={() => onToggleClosure(runway.id)}
          className={`flex flex-1 items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
            runway.isClosed
              ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40'
              : 'border-rose-500/40 bg-rose-950/20 text-rose-300 hover:bg-rose-900/30'
          }`}
        >
          {runway.isClosed ? (
            <>
              <ShieldCheck className="h-3.5 w-3.5" />
              활주로 재개 (OPEN)
            </>
          ) : (
            <>
              <Ban className="h-3.5 w-3.5" />
              활주로 폐쇄 (CLOSE)
            </>
          )}
        </button>

        {/* 비상 활주로 지정 버튼 */}
        {!isEmergencyRunway && (
          <button
            onClick={() => onSetEmergency(runway.id)}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-[11px] text-slate-300 hover:border-amber-500/40 hover:text-amber-300 transition"
            title="이 활주로를 비상 착륙 최우선 활주로로 변경"
          >
            <Star className="h-3 w-3" />
            비상 지정
          </button>
        )}

        {/* 방향/기상 제한 토글 (착륙) */}
        <button
          onClick={() => onToggleDirection(runway.id, 'LANDING')}
          className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] font-mono transition ${
            runway.allowLanding
              ? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300'
              : 'border-slate-700 bg-slate-900 text-slate-500 line-through'
          }`}
          title="기상/접근 조건에 따른 착륙 허용 여부 토글"
        >
          <PlaneLanding className="h-3 w-3" />
          착륙: {runway.allowLanding ? 'ON' : 'OFF'}
        </button>

        {/* 방향/기상 제한 토글 (이륙) */}
        <button
          onClick={() => onToggleDirection(runway.id, 'TAKEOFF')}
          className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] font-mono transition ${
            runway.allowTakeoff
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
              : 'border-slate-700 bg-slate-900 text-slate-500 line-through'
          }`}
          title="풍향/이탈 조건에 따른 이륙 허용 여부 토글"
        >
          <PlaneTakeoff className="h-3 w-3" />
          이륙: {runway.allowTakeoff ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
};
