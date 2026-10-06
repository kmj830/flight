import React, { useEffect, useRef } from 'react';
import { RunwayDto, FlightDto } from '../types';

interface RunwayCanvasProps {
  runways: RunwayDto[];
  emergencyFlights: FlightDto[];
  crashedFlights: FlightDto[];
  tick: number;
}

export const RunwayCanvas: React.FC<RunwayCanvasProps> = ({
  runways,
  emergencyFlights,
  crashedFlights,
  tick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const sweepAngleRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isSubscribed = true;

    const render = () => {
      if (!isSubscribed) return;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Clear background
      ctx.fillStyle = '#060A14';
      ctx.fillRect(0, 0, width, height);

      // 2. Draw radar concentric rings & crosshairs
      ctx.strokeStyle = 'rgba(30, 58, 95, 0.4)';
      ctx.lineWidth = 1;
      const centerX = width * 0.45;
      const centerY = height * 0.5;

      const radii = [70, 140, 210, 280, 350];
      for (const r of radii) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX - 350, centerY);
      ctx.lineTo(centerX + 350, centerY);
      ctx.moveTo(centerX, centerY - 350);
      ctx.lineTo(centerX, centerY + 350);
      ctx.stroke();

      // 3. Radar Sweep Effect
      sweepAngleRef.current = (sweepAngleRef.current + 0.02) % (Math.PI * 2);
      ctx.save();
      ctx.translate(centerX, centerY);
      const sweepGrad = ctx.createConicGradient(sweepAngleRef.current, 0, 0);
      sweepGrad.addColorStop(0, 'rgba(16, 185, 129, 0.18)');
      sweepGrad.addColorStop(0.12, 'rgba(16, 185, 129, 0.0)');
      sweepGrad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 360, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 4. 활주로 좌표 정의
      // 활주로 1: (120, 110) -> (500, 390) (X자 교차)
      // 활주로 2: (120, 390) -> (500, 110) (X자 교차, 교차점 (310, 250))
      // 활주로 3: (620, 90) -> (620, 410) (평행 활주로)
      // 활주로 4+: (730, 90) -> (730, 410)
      const runwayCoords: Record<number, { x1: number; y1: number; x2: number; y2: number }> = {
        1: { x1: 120, y1: 110, x2: 500, y2: 390 },
        2: { x1: 120, y1: 390, x2: 500, y2: 110 },
        3: { x1: 620, y1: 90, x2: 620, y2: 410 },
        4: { x1: 730, y1: 90, x2: 730, y2: 410 },
      };

      // Draw Runways
      for (const runway of runways) {
        const coords = runwayCoords[runway.id] || {
          x1: 40 + (runway.id - 1) * 60,
          y1: 100,
          x2: 40 + (runway.id - 1) * 60,
          y2: 400,
        };

        ctx.save();

        // 활주로 바닥 (Asphalt)
        ctx.strokeStyle = runway.isClosed
          ? 'rgba(75, 20, 20, 0.8)'
          : 'rgba(25, 38, 58, 0.9)';
        ctx.lineWidth = 26;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(coords.x1, coords.y1);
        ctx.lineTo(coords.x2, coords.y2);
        ctx.stroke();

        // 활주로 테두리
        ctx.strokeStyle = runway.isClosed
          ? '#EF4444'
          : runway.currentFlight
          ? (runway.currentFlight.emergency ? '#EF4444' : '#06B6D4')
          : '#334155';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 중앙 점선 (Centerline)
        ctx.strokeStyle = runway.isClosed ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(coords.x1, coords.y1);
        ctx.lineTo(coords.x2, coords.y2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 활주로 폐쇄 시 'X' 표시
        if (runway.isClosed) {
          const midX = (coords.x1 + coords.x2) / 2;
          const midY = (coords.y1 + coords.y2) / 2;
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(midX - 16, midY - 16);
          ctx.lineTo(midX + 16, midY + 16);
          ctx.moveTo(midX + 16, midY - 16);
          ctx.lineTo(midX - 16, midY + 16);
          ctx.stroke();
        }

        // 활주로 명칭 라벨
        ctx.fillStyle = runway.isClosed ? '#EF4444' : '#94A3B8';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(runway.name, coords.x1 - 10, coords.y1 - 16);

        // 현재 배정 비행기 렌더링
        if (runway.currentFlight) {
          const flight = runway.currentFlight;
          const midX = (coords.x1 + coords.x2) / 2;
          const midY = (coords.y1 + coords.y2) / 2;

          // 항공기 위치 및 펄스 효과
          const isEmergency = flight.emergency || flight.fuel === 0;
          const pulse = Math.sin(Date.now() / 150) * 4;

          ctx.fillStyle = isEmergency ? '#EF4444' : (flight.type === 'LANDING' ? '#06B6D4' : '#10B981');
          ctx.beginPath();
          ctx.arc(midX, midY, 9 + (isEmergency ? pulse : 0), 0, Math.PI * 2);
          ctx.fill();

          // 항공기 HUD 텍스트 박스
          ctx.fillStyle = 'rgba(11, 18, 32, 0.9)';
          ctx.strokeStyle = isEmergency ? '#EF4444' : '#38BDF8';
          ctx.lineWidth = 1;
          const tagX = midX + 16;
          const tagY = midY - 20;
          ctx.fillRect(tagX, tagY, 110, 42);
          ctx.strokeRect(tagX, tagY, 110, 42);

          ctx.fillStyle = isEmergency ? '#FCA5A5' : '#F8FAFC';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`✈ #${flight.id}`, tagX + 6, tagY + 14);

          ctx.font = '10px monospace';
          ctx.fillStyle = flight.type === 'LANDING' ? '#38BDF8' : '#34D399';
          ctx.fillText(`${flight.type} | 틱${flight.waitTime}t`, tagX + 6, tagY + 26);

          if (flight.type === 'LANDING') {
            ctx.fillStyle = flight.fuel <= 1 ? '#EF4444' : '#FBBF24';
            ctx.fillText(`연료: ${flight.fuel}`, tagX + 6, tagY + 37);
          }
        }

        ctx.restore();
      }

      // X자 교차점 하이라이트 (Runway 1 & 2)
      if (runways.some(r => r.id === 1) && runways.some(r => r.id === 2)) {
        const intersectX = 310;
        const intersectY = 250;
        ctx.save();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(intersectX, intersectY, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.8)';
        ctx.font = '9px monospace';
        ctx.fillText('X-INTERSECT', intersectX - 30, intersectY + 34);
        ctx.restore();
      }

      // 5. 비상 착륙 및 추락 알림 팝업 애니메이션
      if (crashedFlights.length > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.fillRect(width * 0.35, 18, 240, 32);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`💥 CRASH DETECTED: #${crashedFlights[0].id}`, width * 0.35 + 12, 38);
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isSubscribed = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [runways, emergencyFlights, crashedFlights, tick]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-radar-border bg-radar-panel p-2 shadow-2xl">
      <div className="flex items-center justify-between border-b border-radar-border px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-radar-green opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-radar-green"></span>
          </span>
          <span className="font-semibold tracking-wider text-radar-text uppercase">
            AIRSPACE 2D RADAR DISPLAY (X-RUNWAY MESH)
          </span>
        </div>
        <div className="flex items-center gap-4 text-radar-dim">
          <span>TICK: <strong className="text-radar-cyan font-mono">{tick}</strong></span>
          <span>SCALE: 1:5000</span>
          <span className="text-emerald-400">ACTIVE SCAN</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={820}
        height={480}
        className="w-full h-auto cursor-crosshair rounded-lg bg-[#060A14]"
      />
    </div>
  );
};
