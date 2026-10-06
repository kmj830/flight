package com.airport.flight.engine;

import com.airport.flight.domain.*;
import com.airport.flight.dto.FlightDto;
import com.airport.flight.dto.RunwayDto;
import com.airport.flight.dto.TickResultDto;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class RunwayScheduler {

    private final QueueManager queueManager;
    private final List<Runway> runways = new CopyOnWriteArrayList<>();
    private final AirportMetrics metrics = new AirportMetrics();
    private final SimulationConfig config = new SimulationConfig();
    private long currentTick = 0;

    public RunwayScheduler(QueueManager queueManager) {
        this.queueManager = queueManager;
        initDefaultRunways();
    }

    public synchronized void initDefaultRunways() {
        runways.clear();
        metrics.reset();
        currentTick = 0;

        // 기본 활주로 1: 이착륙 모두 가능, 활주로 2와 X자 교차
        Runway r1 = Runway.builder()
                .id(1)
                .name("활주로 1 (09L/27R)")
                .type(RunwayType.ALL)
                .isClosed(false)
                .crossingRunwayId(2)
                .allowLanding(true)
                .allowTakeoff(true)
                .build();

        // 기본 활주로 2: 이착륙 모두 가능, 활주로 1과 X자 교차
        Runway r2 = Runway.builder()
                .id(2)
                .name("활주로 2 (09R/27L)")
                .type(RunwayType.ALL)
                .isClosed(false)
                .crossingRunwayId(1)
                .allowLanding(true)
                .allowTakeoff(true)
                .build();

        // 기본 활주로 3: 이륙 전용 및 기본 비상 착륙 활주로
        Runway r3 = Runway.builder()
                .id(3)
                .name("활주로 3 (18/36)")
                .type(RunwayType.TAKEOFF_ONLY)
                .isClosed(false)
                .crossingRunwayId(null)
                .allowLanding(true) // 비상 착륙 수용 가능
                .allowTakeoff(true)
                .build();

        runways.add(r1);
        runways.add(r2);
        runways.add(r3);
    }

    public synchronized void reset() {
        initDefaultRunways();
        queueManager.reset();
    }

    public synchronized TickResultDto processTick() {
        currentTick++;
        List<String> events = new ArrayList<>();
        List<FlightDto> emergencyFlightsThisTick = new ArrayList<>();
        List<FlightDto> crashedFlightsThisTick = new ArrayList<>();

        // 0. 각 활주로 상태 초기화
        for (Runway runway : runways) {
            runway.clearFlight();
        }

        // 1. 활주로별 사용 여부 및 상호배제 추적 세트
        Set<Integer> occupiedRunwayIds = new HashSet<>();
        Set<Integer> blockedByMutexRunwayIds = new HashSet<>();

        // 2. [1단계: 연료 감소 및 대기 시간 증가]
        // 착륙 큐 비행기 연료 1 감소 및 대기시간 1 증가
        for (Deque<Flight> queue : queueManager.getLandingQueues().values()) {
            for (Flight f : queue) {
                f.decrementFuel();
                f.incrementWaitTime();
            }
        }
        // 이륙 큐 비행기 대기시간 1 증가
        for (Deque<Flight> queue : queueManager.getTakeoffQueues().values()) {
            for (Flight f : queue) {
                f.incrementWaitTime();
            }
        }

        // 3. [2단계: 긴급 착륙 선점 스케줄링]
        // 각 착륙 큐의 맨 앞(Head)에 있는 비행기 중 잔여 연료가 0인 비행기 탐색
        List<Map.Entry<String, Deque<Flight>>> emergencyQueueCandidates = new ArrayList<>();
        for (Map.Entry<String, Deque<Flight>> entry : queueManager.getLandingQueues().entrySet()) {
            Flight head = entry.getValue().peekFirst();
            if (head != null && head.getFuel() <= 0) {
                emergencyQueueCandidates.add(entry);
            }
        }

        for (Map.Entry<String, Deque<Flight>> entry : emergencyQueueCandidates) {
            Flight emergencyFlight = entry.getValue().peekFirst();
            if (emergencyFlight == null) continue;

            Runway assignedRunway = findRunwayForEmergency(occupiedRunwayIds, blockedByMutexRunwayIds);

            if (assignedRunway != null) {
                // 비행기 큐에서 인출
                entry.getValue().pollFirst();
                emergencyFlight.setStatus(FlightStatus.EMERGENCY_LANDING);
                emergencyFlight.setAssignedRunwayId(assignedRunway.getId());
                emergencyFlight.setEmergency(true);

                assignedRunway.assignFlight(emergencyFlight, "🚨 긴급 착륙: #" + emergencyFlight.getId());
                occupiedRunwayIds.add(assignedRunway.getId());

                if (config.isXCrossingMutexEnabled() && assignedRunway.getCrossingRunwayId() != null) {
                    blockedByMutexRunwayIds.add(assignedRunway.getCrossingRunwayId());
                }

                metrics.recordLanding(emergencyFlight.getWaitTime(), true);
                emergencyFlightsThisTick.add(FlightDto.fromDomain(emergencyFlight));
                events.add("🚨 [긴급 착륙 성공] 비행기 #" + emergencyFlight.getId() + " -> 활주로 " + assignedRunway.getId());
            } else {
                // 할당 가능한 활주로가 없거나 폐쇄/뮤텍스로 인한 추락(Crash)
                entry.getValue().pollFirst();
                emergencyFlight.setStatus(FlightStatus.CRASHED);
                emergencyFlight.setEmergency(true);

                metrics.recordCrash();
                crashedFlightsThisTick.add(FlightDto.fromDomain(emergencyFlight));
                events.add("💥 [추락 사고] 비행기 #" + emergencyFlight.getId() + " - 가용 활주로 부족으로 추락!");
            }
        }

        // 큐 내부에서 헤드 뒤쪽에 대기하다가 연료가 0 미만(고갈)된 비행기 정리 및 추락 처리
        for (Map.Entry<String, Deque<Flight>> entry : queueManager.getLandingQueues().entrySet()) {
            Iterator<Flight> it = entry.getValue().iterator();
            while (it.hasNext()) {
                Flight f = it.next();
                if (f.getFuel() < 0) {
                    it.remove();
                    f.setStatus(FlightStatus.CRASHED);
                    metrics.recordCrash();
                    crashedFlightsThisTick.add(FlightDto.fromDomain(f));
                    events.add("💥 [대기 중 추락] 비행기 #" + f.getId() + " - 큐 대기 중 연료 소진 추락!");
                }
            }
        }

        // 4. [3단계: 일반 착륙 처리]
        // 긴급 착륙에 할당되지 않은 활주로 중 착륙 가능한 활주로(주로 활주로 1, 2)
        List<Runway> availableLandingRunways = getAvailableRunwaysForLanding(occupiedRunwayIds, blockedByMutexRunwayIds);
        for (Runway runway : availableLandingRunways) {
            if (occupiedRunwayIds.contains(runway.getId()) || blockedByMutexRunwayIds.contains(runway.getId())) {
                continue;
            }
            // 가장 대기열이 길거나 연료가 적은 큐를 우선 선택하여 착륙 처리
            Map.Entry<String, Deque<Flight>> bestQueueEntry = findBestLandingQueue();
            if (bestQueueEntry != null && !bestQueueEntry.getValue().isEmpty()) {
                Flight flight = bestQueueEntry.getValue().pollFirst();
                flight.setStatus(FlightStatus.LANDING);
                flight.setAssignedRunwayId(runway.getId());

                runway.assignFlight(flight, "🛬 일반 착륙: #" + flight.getId());
                occupiedRunwayIds.add(runway.getId());

                if (config.isXCrossingMutexEnabled() && runway.getCrossingRunwayId() != null) {
                    blockedByMutexRunwayIds.add(runway.getCrossingRunwayId());
                }

                metrics.recordLanding(flight.getWaitTime(), false);
                events.add("🛬 [일반 착륙] 비행기 #" + flight.getId() + " -> 활주로 " + runway.getId());
            }
        }

        // 5. [4단계: 일반 이륙 처리]
        // 착륙에 사용되지 않은 잔여 활주로(1, 2) 및 활주로 3(이륙 전용)
        List<Runway> availableTakeoffRunways = getAvailableRunwaysForTakeoff(occupiedRunwayIds, blockedByMutexRunwayIds);
        for (Runway runway : availableTakeoffRunways) {
            if (occupiedRunwayIds.contains(runway.getId()) || blockedByMutexRunwayIds.contains(runway.getId())) {
                continue;
            }
            Map.Entry<String, Deque<Flight>> bestQueueEntry = findBestTakeoffQueue(runway.getId());
            if (bestQueueEntry != null && !bestQueueEntry.getValue().isEmpty()) {
                Flight flight = bestQueueEntry.getValue().pollFirst();
                flight.setStatus(FlightStatus.TAKING_OFF);
                flight.setAssignedRunwayId(runway.getId());

                runway.assignFlight(flight, "🛫 일반 이륙: #" + flight.getId());
                occupiedRunwayIds.add(runway.getId());

                if (config.isXCrossingMutexEnabled() && runway.getCrossingRunwayId() != null) {
                    blockedByMutexRunwayIds.add(runway.getCrossingRunwayId());
                }

                metrics.recordTakeoff(flight.getWaitTime());
                events.add("🛫 [일반 이륙] 비행기 #" + flight.getId() + " -> 활주로 " + runway.getId());
            }
        }

        // 6. 틱 결과 DTO 구성
        List<RunwayDto> runwayDtos = new ArrayList<>();
        for (Runway r : runways) {
            runwayDtos.add(RunwayDto.fromDomain(r));
        }

        Map<String, List<FlightDto>> queueDtos = new LinkedHashMap<>();
        for (Map.Entry<String, Deque<Flight>> entry : queueManager.getLandingQueues().entrySet()) {
            List<FlightDto> list = new ArrayList<>();
            for (Flight f : entry.getValue()) {
                list.add(FlightDto.fromDomain(f));
            }
            queueDtos.put(entry.getKey(), list);
        }
        for (Map.Entry<String, Deque<Flight>> entry : queueManager.getTakeoffQueues().entrySet()) {
            List<FlightDto> list = new ArrayList<>();
            for (Flight f : entry.getValue()) {
                list.add(FlightDto.fromDomain(f));
            }
            queueDtos.put(entry.getKey(), list);
        }

        return TickResultDto.builder()
                .tick(currentTick)
                .runways(runwayDtos)
                .queues(queueDtos)
                .events(events)
                .metrics(AirportMetrics.builder()
                        .totalLanded(metrics.getTotalLanded())
                        .totalTookOff(metrics.getTotalTookOff())
                        .totalCrashed(metrics.getTotalCrashed())
                        .totalEmergencyLandings(metrics.getTotalEmergencyLandings())
                        .totalLandingWaitTime(metrics.getTotalLandingWaitTime())
                        .totalTakeoffWaitTime(metrics.getTotalTakeoffWaitTime())
                        .avgLandingWaitTime(metrics.getAvgLandingWaitTime())
                        .avgTakeoffWaitTime(metrics.getAvgTakeoffWaitTime())
                        .build())
                .emergencyFlights(emergencyFlightsThisTick)
                .crashedFlights(crashedFlightsThisTick)
                .config(this.config)
                .build();
    }

    private Runway findRunwayForEmergency(Set<Integer> occupied, Set<Integer> blockedByMutex) {
        // 1순위: 지정된 비상 활주로 (기본: 활주로 3)
        Runway designatedEmergencyRunway = getRunwayById(config.getEmergencyRunwayId());
        if (designatedEmergencyRunway != null
                && !designatedEmergencyRunway.isClosed()
                && !occupied.contains(designatedEmergencyRunway.getId())
                && !blockedByMutex.contains(designatedEmergencyRunway.getId())
                && designatedEmergencyRunway.isAllowLanding()) {
            return designatedEmergencyRunway;
        }

        // 2순위: 활주로 1, 2 및 기타 활주로 순차 확인
        for (Runway r : runways) {
            if (r.getId() == config.getEmergencyRunwayId()) continue;
            if (!r.isClosed()
                    && !occupied.contains(r.getId())
                    && !blockedByMutex.contains(r.getId())
                    && r.isAllowLanding()) {
                return r;
            }
        }
        return null;
    }

    private List<Runway> getAvailableRunwaysForLanding(Set<Integer> occupied, Set<Integer> blockedByMutex) {
        List<Runway> list = new ArrayList<>();
        for (Runway r : runways) {
            if (occupied.contains(r.getId()) || blockedByMutex.contains(r.getId()) || r.isClosed()) {
                continue;
            }
            // 이륙 전용이 아니고 착륙 방향 허용인 경우
            if (r.getType() != RunwayType.TAKEOFF_ONLY && r.isAllowLanding()) {
                list.add(r);
            }
        }
        return list;
    }

    private List<Runway> getAvailableRunwaysForTakeoff(Set<Integer> occupied, Set<Integer> blockedByMutex) {
        List<Runway> list = new ArrayList<>();
        // 활주로 3(이륙 전용)을 우선 배치하고, 이후 나머지 활주로 확인
        for (Runway r : runways) {
            if (occupied.contains(r.getId()) || blockedByMutex.contains(r.getId()) || r.isClosed()) {
                continue;
            }
            if (r.getType() != RunwayType.EMERGENCY_ONLY && r.isAllowTakeoff()) {
                if (r.getType() == RunwayType.TAKEOFF_ONLY) {
                    list.add(0, r); // 이륙 전용 활주로 우선 사용
                } else {
                    list.add(r);
                }
            }
        }
        return list;
    }

    private Map.Entry<String, Deque<Flight>> findBestLandingQueue() {
        Map.Entry<String, Deque<Flight>> best = null;
        int maxLen = -1;
        int minHeadFuel = Integer.MAX_VALUE;

        for (Map.Entry<String, Deque<Flight>> entry : queueManager.getLandingQueues().entrySet()) {
            if (entry.getValue().isEmpty()) continue;
            Flight head = entry.getValue().peekFirst();
            int len = entry.getValue().size();

            // 헤드의 연료가 가장 낮거나, 대기열 길이가 긴 큐 우선
            if (head != null && head.getFuel() < minHeadFuel) {
                minHeadFuel = head.getFuel();
                maxLen = len;
                best = entry;
            } else if (head != null && head.getFuel() == minHeadFuel && len > maxLen) {
                maxLen = len;
                best = entry;
            }
        }
        return best;
    }

    private Map.Entry<String, Deque<Flight>> findBestTakeoffQueue(int runwayId) {
        // 활주로 ID에 해당하는 T_Q가 우선
        String dedicatedKey = "T_Q" + runwayId;
        Deque<Flight> dedicated = queueManager.getTakeoffQueues().get(dedicatedKey);
        if (dedicated != null && !dedicated.isEmpty()) {
            for (Map.Entry<String, Deque<Flight>> entry : queueManager.getTakeoffQueues().entrySet()) {
                if (entry.getKey().equals(dedicatedKey)) return entry;
            }
        }

        // 그 외에는 가장 대기열이 긴 이륙 큐
        Map.Entry<String, Deque<Flight>> best = null;
        int maxLen = -1;
        for (Map.Entry<String, Deque<Flight>> entry : queueManager.getTakeoffQueues().entrySet()) {
            if (entry.getValue().isEmpty()) continue;
            if (entry.getValue().size() > maxLen) {
                maxLen = entry.getValue().size();
                best = entry;
            }
        }
        return best;
    }

    public Runway getRunwayById(int id) {
        for (Runway r : runways) {
            if (r.getId() == id) return r;
        }
        return null;
    }

    public synchronized void toggleRunwayClosure(int runwayId) {
        Runway r = getRunwayById(runwayId);
        if (r != null) {
            r.setClosed(!r.isClosed());
        }
    }

    public synchronized void toggleRunwayDirection(int runwayId, String operation) {
        Runway r = getRunwayById(runwayId);
        if (r != null) {
            if ("LANDING".equalsIgnoreCase(operation)) {
                r.setAllowLanding(!r.isAllowLanding());
            } else if ("TAKEOFF".equalsIgnoreCase(operation)) {
                r.setAllowTakeoff(!r.isAllowTakeoff());
            }
        }
    }

    public synchronized void setEmergencyRunwayId(int runwayId) {
        Runway r = getRunwayById(runwayId);
        if (r != null) {
            this.config.setEmergencyRunwayId(runwayId);
        }
    }

    public synchronized Runway addNewRunway(String name, RunwayType type, Integer crossingRunwayId) {
        int newId = runways.size() + 1;
        String rName = (name != null && !name.isBlank()) ? name : "활주로 " + newId;
        RunwayType rType = (type != null) ? type : RunwayType.ALL;

        Runway newRunway = Runway.builder()
                .id(newId)
                .name(rName)
                .type(rType)
                .isClosed(false)
                .crossingRunwayId(crossingRunwayId)
                .allowLanding(true)
                .allowTakeoff(true)
                .build();

        runways.add(newRunway);
        queueManager.registerNewRunway(newId, rType);
        return newRunway;
    }

    public List<Runway> getRunways() {
        return runways;
    }

    public AirportMetrics getMetrics() {
        return metrics;
    }

    public SimulationConfig getConfig() {
        return config;
    }

    public long getCurrentTick() {
        return currentTick;
    }
}
