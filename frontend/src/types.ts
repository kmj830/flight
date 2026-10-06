export type FlightType = 'LANDING' | 'TAKEOFF';

export type FlightStatus = 
  | 'QUEUED' 
  | 'LANDING' 
  | 'EMERGENCY_LANDING' 
  | 'TAKING_OFF' 
  | 'CRASHED' 
  | 'FINISHED';

export type RunwayType = 'ALL' | 'TAKEOFF_ONLY' | 'EMERGENCY_ONLY';

export interface FlightDto {
  id: number;
  type: FlightType;
  fuel: number;
  initialFuel: number;
  waitTime: number;
  status: FlightStatus;
  queueName: string;
  assignedRunwayId?: number | null;
  emergency: boolean;
  arrivedTick: number;
}

export interface RunwayDto {
  id: number;
  name: string;
  type: RunwayType;
  isClosed: boolean;
  crossingRunwayId?: number | null;
  allowLanding: boolean;
  allowTakeoff: boolean;
  currentFlight?: FlightDto | null;
  lastOperation: string;
}

export interface AirportMetrics {
  totalLanded: number;
  totalTookOff: number;
  totalCrashed: number;
  totalEmergencyLandings: number;
  totalLandingWaitTime: number;
  totalTakeoffWaitTime: number;
  avgLandingWaitTime: number;
  avgTakeoffWaitTime: number;
}

export interface SimulationConfig {
  tickIntervalMs: number;
  xCrossingMutexEnabled: boolean;
  emergencyRunwayId: number;
  landingArrivalMin: number;
  landingArrivalMax: number;
  takeoffArrivalMin: number;
  takeoffArrivalMax: number;
  fuelMin: number;
  fuelMax: number;
  running: boolean;
}

export interface TickResultDto {
  tick: number;
  runways: RunwayDto[];
  queues: Record<string, FlightDto[]>;
  events: string[];
  metrics: AirportMetrics;
  emergencyFlights: FlightDto[];
  crashedFlights: FlightDto[];
  config: SimulationConfig;
}
