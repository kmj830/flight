import React from 'react';
import { 
  CheckCircle, 
  Send, 
  AlertOctagon, 
  Timer, 
  ShieldAlert,
  TrendingUp 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { AirportMetrics } from '../types';

interface MetricsPanelProps {
  metrics: AirportMetrics;
  history: Array<{
    tick: number;
    landed: number;
    tookOff: number;
    crashed: number;
    avgLandingWait: number;
    avgTakeoffWait: number;
  }>;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics, history }) => {
  return (
    <div className="rounded-xl border border-radar-border bg-radar-panel p-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-radar-border pb-3 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-radar-cyan" />
          <h2 className="text-xs font-bold tracking-wider text-slate-100 uppercase">
            관제 운영 통계 & 메트릭 분석
          </h2>
        </div>
        <span className="text-[10px] text-radar-dim font-mono">
          AGGREGATED TELEMETRY
        </span>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {/* 총 착륙 */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
            <CheckCircle className="h-3.5 w-3.5 text-cyan-400" />
            <span>총 착륙 완료</span>
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300">
            {metrics.totalLanded}
          </div>
        </div>

        {/* 총 이륙 */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
            <Send className="h-3.5 w-3.5 text-emerald-400" />
            <span>총 이륙 완료</span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300">
            {metrics.totalTookOff}
          </div>
        </div>

        {/* 긴급 착륙 */}
        <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3">
          <div className="flex items-center gap-1.5 text-amber-300 text-[11px] mb-1">
            <AlertOctagon className="h-3.5 w-3.5 text-amber-400" />
            <span>긴급 착륙 성공</span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">
            {metrics.totalEmergencyLandings}
          </div>
        </div>

        {/* 추락 사고 */}
        <div className="rounded-lg border border-rose-900/40 bg-rose-950/20 p-3">
          <div className="flex items-center gap-1.5 text-rose-300 text-[11px] mb-1">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            <span>추락 사고 (사상)</span>
          </div>
          <div className="text-xl font-bold font-mono text-rose-400">
            {metrics.totalCrashed}
          </div>
        </div>

        {/* 평균 착륙 대기 시간 */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
            <Timer className="h-3.5 w-3.5 text-cyan-400" />
            <span>착륙 평균 대기</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {metrics.avgLandingWaitTime.toFixed(1)}
            <span className="text-xs text-slate-400 font-normal ml-1">틱</span>
          </div>
        </div>

        {/* 평균 이륙 대기 시간 */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
            <Timer className="h-3.5 w-3.5 text-emerald-400" />
            <span>이륙 평균 대기</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {metrics.avgTakeoffWaitTime.toFixed(1)}
            <span className="text-xs text-slate-400 font-normal ml-1">틱</span>
          </div>
        </div>
      </div>

      {/* Historical Trend Chart */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
        <div className="text-[11px] text-slate-400 mb-2 flex items-center justify-between">
          <span>대기시간 및 누적 운항 추이 (최근 틱 타임라인)</span>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-cyan-400">■ 착륙 대기</span>
            <span className="text-emerald-400">■ 이륙 대기</span>
            <span className="text-rose-400">■ 추락 누적</span>
          </div>
        </div>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="tick" stroke="#64748B" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748B" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  fontSize: '11px',
                  borderRadius: '6px',
                }}
              />
              <Line
                type="monotone"
                dataKey="avgLandingWait"
                name="착륙 대기시간"
                stroke="#06B6D4"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="avgTakeoffWait"
                name="이륙 대기시간"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="crashed"
                name="누적 추락"
                stroke="#EF4444"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
