import { TickResultDto, SimulationConfig } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function fetchState(): Promise<TickResultDto> {
  const res = await fetch(`${API_BASE}/api/simulation/state`);
  if (!res.ok) throw new Error('Failed to fetch state');
  return res.json();
}

export async function startSimulation(): Promise<void> {
  await fetch(`${API_BASE}/api/simulation/start`, { method: 'POST' });
}

export async function pauseSimulation(): Promise<void> {
  await fetch(`${API_BASE}/api/simulation/pause`, { method: 'POST' });
}

export async function stepSimulation(): Promise<TickResultDto> {
  const res = await fetch(`${API_BASE}/api/simulation/step`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to step simulation');
  return res.json();
}

export async function resetSimulation(): Promise<void> {
  await fetch(`${API_BASE}/api/simulation/reset`, { method: 'POST' });
}

export async function updateConfig(config: Partial<SimulationConfig>): Promise<void> {
  await fetch(`${API_BASE}/api/simulation/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
}

export async function toggleRunwayClosure(runwayId: number): Promise<void> {
  await fetch(`${API_BASE}/api/simulation/runways/${runwayId}/toggle-closure`, { method: 'POST' });
}

export async function toggleRunwayDirection(runwayId: number, operation: 'LANDING' | 'TAKEOFF'): Promise<void> {
  await fetch(`${API_BASE}/api/simulation/runways/${runwayId}/toggle-direction?operation=${operation}`, { method: 'POST' });
}

export async function setEmergencyRunway(runwayId: number): Promise<void> {
  await fetch(`${API_BASE}/api/simulation/runways/emergency?runwayId=${runwayId}`, { method: 'POST' });
}

export async function addRunway(name: string, type: string, crossingRunwayId?: number | null): Promise<void> {
  await fetch(`${API_BASE}/api/simulation/runways/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type, crossingRunwayId }),
  });
}

export async function spawnFlight(type: 'LANDING' | 'TAKEOFF', fuel?: number, targetQueue?: string): Promise<void> {
  await fetch(`${API_BASE}/api/simulation/spawn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, fuel, targetQueue }),
  });
}
