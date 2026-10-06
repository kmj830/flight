package com.airport.flight.engine;

import com.airport.flight.domain.*;
import com.airport.flight.dto.ControlCommandDto;
import com.airport.flight.dto.SpawnFlightRequestDto;
import com.airport.flight.dto.TickResultDto;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class SimulationEngine {

    private final QueueManager queueManager;
    private final RunwayScheduler runwayScheduler;
    private final SimpMessagingTemplate messagingTemplate;

    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
    private ScheduledFuture<?> currentTask;
    private final Random random = new Random();

    private TickResultDto lastTickResult;

    public SimulationEngine(QueueManager queueManager,
                            RunwayScheduler runwayScheduler,
                            SimpMessagingTemplate messagingTemplate) {
        this.queueManager = queueManager;
        this.runwayScheduler = runwayScheduler;
        this.messagingTemplate = messagingTemplate;
    }

    public synchronized TickResultDto step() {
        SimulationConfig config = runwayScheduler.getConfig();
        long currentTick = runwayScheduler.getCurrentTick() + 1;

        // 1. 무작위 비행기 생성 및 로드 밸런싱 큐 삽입
        int landingCount = random.nextInt((config.getLandingArrivalMax() - config.getLandingArrivalMin()) + 1) + config.getLandingArrivalMin();
        for (int i = 0; i < landingCount; i++) {
            int fuel = random.nextInt((config.getFuelMax() - config.getFuelMin()) + 1) + config.getFuelMin();
            queueManager.addLandingFlight(fuel, currentTick);
        }

        int takeoffCount = random.nextInt((config.getTakeoffArrivalMax() - config.getTakeoffArrivalMin()) + 1) + config.getTakeoffArrivalMin();
        for (int i = 0; i < takeoffCount; i++) {
            queueManager.addTakeoffFlight(currentTick);
        }

        // 2. 활주로 스케줄링 실행
        TickResultDto result = runwayScheduler.processTick();

        // 비행기 도착 이벤트 추가
        if (landingCount > 0) {
            result.getEvents().add(0, "📥 [신규 착륙 진입] " + landingCount + "대 공역 진입 (큐 자동 분배)");
        }
        if (takeoffCount > 0) {
            result.getEvents().add(0, "📥 [신규 이륙 대기] " + takeoffCount + "대 활주로 대기열 진입");
        }

        this.lastTickResult = result;
        broadcast(result);
        return result;
    }

    public synchronized void start() {
        SimulationConfig config = runwayScheduler.getConfig();
        if (config.isRunning()) return;

        config.setRunning(true);
        if (currentTask != null && !currentTask.isDone()) {
            currentTask.cancel(false);
        }

        currentTask = scheduler.scheduleAtFixedRate(
                this::safeStep,
                0,
                config.getTickIntervalMs(),
                TimeUnit.MILLISECONDS
        );
        log.info("Simulation started with interval {} ms", config.getTickIntervalMs());
    }

    public synchronized void pause() {
        SimulationConfig config = runwayScheduler.getConfig();
        config.setRunning(false);
        if (currentTask != null && !currentTask.isDone()) {
            currentTask.cancel(false);
        }
        log.info("Simulation paused");
        if (lastTickResult != null) {
            broadcast(lastTickResult);
        }
    }

    public synchronized void reset() {
        pause();
        runwayScheduler.reset();
        lastTickResult = runwayScheduler.processTick();
        lastTickResult.getEvents().add("🔄 [초기화 완료] 시뮬레이션 시스템이 초기 상태로 리셋되었습니다.");
        broadcast(lastTickResult);
        log.info("Simulation reset");
    }

    public synchronized Flight spawnFlight(SpawnFlightRequestDto request) {
        long tick = runwayScheduler.getCurrentTick();
        Flight flight = queueManager.spawnCustomFlight(request.getType(), request.getFuel(), request.getTargetQueue(), tick);
        log.info("Flight manually spawned: {}", flight);

        // 현재 큐 상태 브로드캐스트
        if (lastTickResult != null) {
            lastTickResult = runwayScheduler.processTick();
            lastTickResult.getEvents().add("🚨 [수동 편대 생성] 비행기 #" + flight.getId() + " (" + flight.getType() + ") 즉시 투입");
            broadcast(lastTickResult);
        }
        return flight;
    }

    public synchronized void updateConfig(ControlCommandDto cmd) {
        SimulationConfig config = runwayScheduler.getConfig();
        if (cmd.getTickIntervalMs() != null) {
            config.setTickIntervalMs(Math.max(100, cmd.getTickIntervalMs()));
            if (config.isRunning()) {
                pause();
                start();
            }
        }
        if (cmd.getXCrossingMutexEnabled() != null) {
            config.setXCrossingMutexEnabled(cmd.getXCrossingMutexEnabled());
        }
        if (cmd.getEmergencyRunwayId() != null) {
            runwayScheduler.setEmergencyRunwayId(cmd.getEmergencyRunwayId());
        }
    }

    public TickResultDto getCurrentState() {
        if (lastTickResult == null) {
            lastTickResult = runwayScheduler.processTick();
        }
        return lastTickResult;
    }

    private void safeStep() {
        try {
            step();
        } catch (Exception e) {
            log.error("Error during simulation tick execution", e);
        }
    }

    private void broadcast(TickResultDto result) {
        try {
            if (messagingTemplate != null) {
                messagingTemplate.convertAndSend("/topic/simulation", result);
            }
        } catch (Exception e) {
            log.warn("Failed to broadcast simulation tick to WebSocket", e);
        }
    }

    @PreDestroy
    public void cleanup() {
        scheduler.shutdownNow();
    }
}
