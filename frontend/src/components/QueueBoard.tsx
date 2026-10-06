import React from 'react';
import { PlaneLanding, PlaneTakeoff, Fuel, Clock } from 'lucide-react';
import { FlightDto } from '../types';

interface QueueBoardProps {
  queues: Record<string, FlightDto[]>;
}

export const QueueBoard: React.FC<QueueBoardProps> = ({ queues }) => {
  const landingKeys = Object.keys(queues).filter(k => k.startsWith('L_Q'));
  const takeoffKeys = Object.keys(queues).filter(k => k.startsWith('T_Q'));

  return (
    <div className="rounded-xl border border-radar-border bg-radar-panel p-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-radar-border pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-radar-cyan" />
          <h2 className="text-xs font-bold tracking-wider text-slate-100 uppercase">
            FIFO 대기열 모니터링 (로드 밸런싱)
          </h2>
        </div>
        <div className="flex items-center gap-4 text-xs text-radar-dim">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400" /> 착륙 큐 (4개 기본)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> 이륙 큐 (3개 기본)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 착륙 큐 섹션 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
            <PlaneLanding className="h-4 w-4" />
            <span>착륙 대기열 (LANDING QUEUES)</span>
          </div>

          {landingKeys.map((key) => {
            const list = queues[key] || [];
            return (
              <div
                key={key}
                className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5"
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono font-bold text-cyan-300">{key}</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 font-mono">
                    대기: {list.length}대
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 min-h-[48px]">
                  {list.length === 0 ? (
                    <div className="text-[11px] text-slate-600 italic">대기 비행기 없음 (비어있음)</div>
                  ) : (
                    list.map((flight, idx) => (
                      <div
                        key={flight.id}
                        className={`flex flex-col flex-shrink-0 rounded-md border p-1.5 min-w-[76px] text-[10px] font-mono ${
                          idx === 0
                            ? 'border-cyan-400/50 bg-cyan-950/40 ring-1 ring-cyan-400/30'
                            : 'border-slate-700/80 bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-slate-200">
                          <span>#{flight.id}</span>
                          {idx === 0 && (
                            <span className="rounded bg-cyan-500/20 px-1 text-[8px] text-cyan-300">
                              HEAD
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Fuel className="h-2.5 w-2.5 text-slate-400" />
                          <span
                            className={`font-semibold ${
                              flight.fuel <= 0
                                ? 'text-rose-400 font-bold animate-pulse'
                                : flight.fuel <= 2
                                ? 'text-amber-400'
                                : 'text-slate-300'
                            }`}
                          >
                            {flight.fuel <= 0 ? '긴급(0)' : `${flight.fuel}t`}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 이륙 큐 섹션 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <PlaneTakeoff className="h-4 w-4" />
            <span>이륙 대기열 (TAKEOFF QUEUES)</span>
          </div>

          {takeoffKeys.map((key) => {
            const list = queues[key] || [];
            return (
              <div
                key={key}
                className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5"
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono font-bold text-emerald-300">{key}</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 font-mono">
                    대기: {list.length}대
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 min-h-[48px]">
                  {list.length === 0 ? (
                    <div className="text-[11px] text-slate-600 italic">대기 비행기 없음 (비어있음)</div>
                  ) : (
                    list.map((flight, idx) => (
                      <div
                        key={flight.id}
                        className={`flex flex-col flex-shrink-0 rounded-md border p-1.5 min-w-[76px] text-[10px] font-mono ${
                          idx === 0
                            ? 'border-emerald-400/50 bg-emerald-950/40 ring-1 ring-emerald-400/30'
                            : 'border-slate-700/80 bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-slate-200">
                          <span>#{flight.id}</span>
                          {idx === 0 && (
                            <span className="rounded bg-emerald-500/20 px-1 text-[8px] text-emerald-300">
                              HEAD
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-slate-400">
                          <Clock className="h-2.5 w-2.5" />
                          <span>대기: {flight.waitTime}t</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
