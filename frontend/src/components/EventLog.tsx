import React from 'react';
import { Terminal, Trash2 } from 'lucide-react';

interface EventLogProps {
  events: string[];
  onClear: () => void;
}

export const EventLog: React.FC<EventLogProps> = ({ events, onClear }) => {
  return (
    <div className="rounded-xl border border-radar-border bg-radar-panel p-4 shadow-xl flex flex-col h-[340px]">
      <div className="flex items-center justify-between border-b border-radar-border pb-3 mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-radar-cyan" />
          <h2 className="text-xs font-bold tracking-wider text-slate-100 uppercase">
            실시간 관제 이벤트 로그 (ATC TERMINAL LOG)
          </h2>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition"
        >
          <Trash2 className="h-3 w-3" />
          로그 비우기
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
        {events.length === 0 ? (
          <div className="text-slate-600 italic py-8 text-center">
            수신된 이벤트 로그가 없습니다. 시뮬레이션을 시작하거나 단일 틱을 진행하세요.
          </div>
        ) : (
          events.map((evt, idx) => {
            const isCrash = evt.includes('추락') || evt.includes('CRASH');
            const isEmergency = evt.includes('긴급') || evt.includes('비상');
            const isLanding = evt.includes('착륙');
            const isTakeoff = evt.includes('이륙');

            return (
              <div
                key={idx}
                className={`rounded px-2.5 py-1 transition border ${
                  isCrash
                    ? 'border-red-900/50 bg-red-950/30 text-rose-300'
                    : isEmergency
                    ? 'border-amber-900/50 bg-amber-950/30 text-amber-200'
                    : isLanding
                    ? 'border-cyan-950 bg-cyan-950/20 text-cyan-200'
                    : isTakeoff
                    ? 'border-emerald-950 bg-emerald-950/20 text-emerald-200'
                    : 'border-slate-800 bg-slate-900/40 text-slate-300'
                }`}
              >
                {evt}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
