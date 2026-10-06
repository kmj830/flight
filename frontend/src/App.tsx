import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TickResultDto, RunwayType } from './types';
import * as api from './services/api';
import { createStompClient } from './services/websocket';
import { Header } from './components/Header';
import { ControlDeck } from './components/ControlDeck';
import { RunwayCanvas } from './components/RunwayCanvas';
import { RunwayControlCard } from './components/RunwayControlCard';
import { QueueBoard } from './components/QueueBoard';
import { MetricsPanel } from './components/MetricsPanel';
import { EventLog } from './components/EventLog';
import { AddRunwayModal } from './components/AddRunwayModal';

export const App: React.FC = () => {
  const [data, setData] = useState<TickResultDto | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [events, setEvents] = useState<string[]>([]);
  const [history, setHistory] = useState<Array<{
    tick: number;
    landed: number;
    tookOff: number;
    crashed: number;
    avgLandingWait: number;
    avgTakeoffWait: number;
  }>>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const stompClientRef = useRef<any>(null);

  const handleTickUpdate = useCallback((newResult: TickResultDto) => {
    setData(newResult);

    if (newResult.events && newResult.events.length > 0) {
      setEvents((prev) => [...newResult.events, ...prev].slice(0, 80));
    }

    if (newResult.metrics) {
      setHistory((prev) => {
        const item = {
          tick: newResult.tick,
          landed: newResult.metrics.totalLanded,
          tookOff: newResult.metrics.totalTookOff,
          crashed: newResult.metrics.totalCrashed,
          avgLandingWait: Number(newResult.metrics.avgLandingWaitTime.toFixed(1)),
          avgTakeoffWait: Number(newResult.metrics.avgTakeoffWaitTime.toFixed(1)),
        };
        const next = [...prev, item];
        return next.slice(-25); // 최근 25개 틱 보관
      });
    }
  }, []);

  // 1. 초기 상태 로드 및 WebSocket 연결
  useEffect(() => {
    api.fetchState()
      .then((initialData) => {
        setData(initialData);
        if (initialData.events) {
          setEvents(initialData.events);
        }
      })
      .catch((err) => {
        console.warn('Initial state fetch failed (backend might still be starting):', err);
      });

    const client = createStompClient(handleTickUpdate, (isConnected) => {
      setConnected(isConnected);
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [handleTickUpdate]);

  // 핸들러 함수들
  const handleStart = async () => {
    try {
      await api.startSimulation();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePause = async () => {
    try {
      await api.pauseSimulation();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStep = async () => {
    try {
      const res = await api.stepSimulation();
      handleTickUpdate(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = async () => {
    try {
      await api.resetSimulation();
      setHistory([]);
      const state = await api.fetchState();
      handleTickUpdate(state);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSpeedChange = async (speed: number) => {
    try {
      await api.updateConfig({ tickIntervalMs: speed });
      if (data) {
        setData({
          ...data,
          config: { ...data.config, tickIntervalMs: speed },
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleMutex = async (enabled: boolean) => {
    try {
      await api.updateConfig({ xCrossingMutexEnabled: enabled });
      if (data) {
        setData({
          ...data,
          config: { ...data.config, xCrossingMutexEnabled: enabled },
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleClosure = async (runwayId: number) => {
    try {
      await api.toggleRunwayClosure(runwayId);
      const state = await api.fetchState();
      handleTickUpdate(state);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleDirection = async (runwayId: number, op: 'LANDING' | 'TAKEOFF') => {
    try {
      await api.toggleRunwayDirection(runwayId, op);
      const state = await api.fetchState();
      handleTickUpdate(state);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetEmergency = async (runwayId: number) => {
    try {
      await api.setEmergencyRunway(runwayId);
      const state = await api.fetchState();
      handleTickUpdate(state);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddRunway = async (name: string, type: RunwayType, crossingId?: number | null) => {
    try {
      await api.addRunway(name, type, crossingId);
      const state = await api.fetchState();
      handleTickUpdate(state);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSpawnEmergency = async () => {
    try {
      await api.spawnFlight('LANDING', 0);
      const state = await api.fetchState();
      handleTickUpdate(state);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSpawnTakeoff = async () => {
    try {
      await api.spawnFlight('TAKEOFF');
      const state = await api.fetchState();
      handleTickUpdate(state);
    } catch (e) {
      console.error(e);
    }
  };

  if (!data) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-radar-bg text-radar-cyan font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-radar-cyan border-t-transparent" />
          <p className="text-xs tracking-widest uppercase">INITIALIZING RADAR SYSTEM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-radar-bg text-radar-text pb-12">
      {/* 1. 최상단 헤더 */}
      <Header
        connected={connected}
        tick={data.tick}
        running={data.config.running}
        crashedCount={data.metrics.totalCrashed}
      />

      <main className="mx-auto max-w-[1600px] px-4 py-4 space-y-4">
        {/* 2. 메인 시뮬레이션 제어 바 */}
        <ControlDeck
          config={data.config}
          onStart={handleStart}
          onPause={handlePause}
          onStep={handleStep}
          onReset={handleReset}
          onSpeedChange={handleSpeedChange}
          onToggleMutex={handleToggleMutex}
          onSpawnEmergency={handleSpawnEmergency}
          onSpawnTakeoff={handleSpawnTakeoff}
          onOpenAddRunway={() => setIsAddModalOpen(true)}
        />

        {/* 3. 중앙 레이아웃: 2D 레이더 캔버스 & 개별 활주로 제어 카드 */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* 좌측 2D 레이더 화면 (8칸) */}
          <div className="xl:col-span-8">
            <RunwayCanvas
              runways={data.runways}
              emergencyFlights={data.emergencyFlights}
              crashedFlights={data.crashedFlights}
              tick={data.tick}
            />
          </div>

          {/* 우측 활주로별 제어 카드 (4칸) */}
          <div className="xl:col-span-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-radar-border pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                활주로 개별 관제 (RUNWAY INTERCEPT MATRIX)
              </span>
              <span className="text-[10px] text-radar-dim font-mono">
                {data.runways.length}개 활주로 운용
              </span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1">
              {data.runways.map((runway) => (
                <RunwayControlCard
                  key={runway.id}
                  runway={runway}
                  isEmergencyRunway={data.config.emergencyRunwayId === runway.id}
                  onToggleClosure={handleToggleClosure}
                  onToggleDirection={handleToggleDirection}
                  onSetEmergency={handleSetEmergency}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 4. FIFO 대기열 보드 */}
        <QueueBoard queues={data.queues} />

        {/* 5. 하단 분석 통계 및 실시간 이벤트 터미널 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8">
            <MetricsPanel metrics={data.metrics} history={history} />
          </div>
          <div className="lg:col-span-4">
            <EventLog events={events} onClear={() => setEvents([])} />
          </div>
        </div>
      </main>

      {/* 신규 활주로 동적 증설 모달 */}
      <AddRunwayModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddRunway}
        existingRunways={data.runways}
      />
    </div>
  );
};

export default App;
