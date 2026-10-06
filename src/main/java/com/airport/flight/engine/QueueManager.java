package com.airport.flight.engine;

import com.airport.flight.domain.Flight;
import com.airport.flight.domain.FlightStatus;
import com.airport.flight.domain.FlightType;
import com.airport.flight.domain.RunwayType;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class QueueManager {

    private final AtomicInteger nextLandingId = new AtomicInteger(1002);
    private final AtomicInteger nextTakeoffId = new AtomicInteger(1001);

    // 순서 유지를 위한 LinkedHashMap (key: 큐 이름, value: Deque<Flight>)
    private final Map<String, Deque<Flight>> landingQueues = Collections.synchronizedMap(new LinkedHashMap<>());
    private final Map<String, Deque<Flight>> takeoffQueues = Collections.synchronizedMap(new LinkedHashMap<>());

    public QueueManager() {
        initDefaultQueues();
    }

    public synchronized void initDefaultQueues() {
        landingQueues.clear();
        takeoffQueues.clear();
        nextLandingId.set(1002);
        nextTakeoffId.set(1001);

        // 기본 활주로 1, 2용 착륙 큐 4개
        landingQueues.put("L_Q1", new ConcurrentLinkedDeque<>());
        landingQueues.put("L_Q2", new ConcurrentLinkedDeque<>());
        landingQueues.put("L_Q3", new ConcurrentLinkedDeque<>());
        landingQueues.put("L_Q4", new ConcurrentLinkedDeque<>());

        // 기본 활주로 1, 2, 3용 이륙 큐 3개
        takeoffQueues.put("T_Q1", new ConcurrentLinkedDeque<>());
        takeoffQueues.put("T_Q2", new ConcurrentLinkedDeque<>());
        takeoffQueues.put("T_Q3", new ConcurrentLinkedDeque<>());
    }

    public synchronized void reset() {
        initDefaultQueues();
    }

    public synchronized Flight addLandingFlight(int fuel, long tick) {
        int id = nextLandingId.getAndAdd(2);
        String targetQueue = findShortestQueue(landingQueues);

        Flight flight = Flight.builder()
                .id(id)
                .type(FlightType.LANDING)
                .fuel(fuel)
                .initialFuel(fuel)
                .waitTime(0)
                .status(FlightStatus.QUEUED)
                .queueName(targetQueue)
                .arrivedTick(tick)
                .build();

        landingQueues.get(targetQueue).addLast(flight);
        return flight;
    }

    public synchronized Flight addTakeoffFlight(long tick) {
        int id = nextTakeoffId.getAndAdd(2);
        String targetQueue = findShortestQueue(takeoffQueues);

        Flight flight = Flight.builder()
                .id(id)
                .type(FlightType.TAKEOFF)
                .fuel(0)
                .initialFuel(0)
                .waitTime(0)
                .status(FlightStatus.QUEUED)
                .queueName(targetQueue)
                .arrivedTick(tick)
                .build();

        takeoffQueues.get(targetQueue).addLast(flight);
        return flight;
    }

    public synchronized Flight spawnCustomFlight(FlightType type, Integer fuel, String targetQueue, long tick) {
        if (type == FlightType.LANDING) {
            int id = nextLandingId.getAndAdd(2);
            int flightFuel = (fuel != null) ? fuel : 5;
            String queue = (targetQueue != null && landingQueues.containsKey(targetQueue))
                    ? targetQueue
                    : findShortestQueue(landingQueues);

            Flight flight = Flight.builder()
                    .id(id)
                    .type(FlightType.LANDING)
                    .fuel(flightFuel)
                    .initialFuel(flightFuel)
                    .waitTime(0)
                    .status(FlightStatus.QUEUED)
                    .queueName(queue)
                    .arrivedTick(tick)
                    .build();

            landingQueues.get(queue).addLast(flight);
            return flight;
        } else {
            int id = nextTakeoffId.getAndAdd(2);
            String queue = (targetQueue != null && takeoffQueues.containsKey(targetQueue))
                    ? targetQueue
                    : findShortestQueue(takeoffQueues);

            Flight flight = Flight.builder()
                    .id(id)
                    .type(FlightType.TAKEOFF)
                    .fuel(0)
                    .initialFuel(0)
                    .waitTime(0)
                    .status(FlightStatus.QUEUED)
                    .queueName(queue)
                    .arrivedTick(tick)
                    .build();

            takeoffQueues.get(queue).addLast(flight);
            return flight;
        }
    }

    public synchronized void registerNewRunway(int runwayId, RunwayType type) {
        if (type == RunwayType.ALL || type == RunwayType.EMERGENCY_ONLY) {
            String lqKey = "L_Q" + (landingQueues.size() + 1);
            landingQueues.put(lqKey, new ConcurrentLinkedDeque<>());
        }
        if (type == RunwayType.ALL || type == RunwayType.TAKEOFF_ONLY) {
            String tqKey = "T_Q" + (takeoffQueues.size() + 1);
            takeoffQueues.put(tqKey, new ConcurrentLinkedDeque<>());
        }
    }

    private String findShortestQueue(Map<String, Deque<Flight>> queues) {
        String minQueue = null;
        int minSize = Integer.MAX_VALUE;

        for (Map.Entry<String, Deque<Flight>> entry : queues.entrySet()) {
            int size = entry.getValue().size();
            if (size < minSize) {
                minSize = size;
                minQueue = entry.getKey();
            }
        }
        return minQueue != null ? minQueue : queues.keySet().iterator().next();
    }

    public Map<String, Deque<Flight>> getLandingQueues() {
        return landingQueues;
    }

    public Map<String, Deque<Flight>> getTakeoffQueues() {
        return takeoffQueues;
    }

    public synchronized Map<String, List<Flight>> getAllQueuesSnapshot() {
        Map<String, List<Flight>> snapshot = new LinkedHashMap<>();
        for (Map.Entry<String, Deque<Flight>> entry : landingQueues.entrySet()) {
            snapshot.put(entry.getKey(), new ArrayList<>(entry.getValue()));
        }
        for (Map.Entry<String, Deque<Flight>> entry : takeoffQueues.entrySet()) {
            snapshot.put(entry.getKey(), new ArrayList<>(entry.getValue()));
        }
        return snapshot;
    }
}
