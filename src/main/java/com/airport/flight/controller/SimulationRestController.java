package com.airport.flight.controller;

import com.airport.flight.domain.Flight;
import com.airport.flight.domain.Runway;
import com.airport.flight.dto.AddRunwayRequestDto;
import com.airport.flight.dto.ControlCommandDto;
import com.airport.flight.dto.SpawnFlightRequestDto;
import com.airport.flight.dto.TickResultDto;
import com.airport.flight.engine.RunwayScheduler;
import com.airport.flight.engine.SimulationEngine;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/simulation")
@RequiredArgsConstructor
public class SimulationRestController {

    private final SimulationEngine simulationEngine;
    private final RunwayScheduler runwayScheduler;

    @GetMapping("/state")
    public ResponseEntity<TickResultDto> getState() {
        return ResponseEntity.ok(simulationEngine.getCurrentState());
    }

    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> start() {
        simulationEngine.start();
        return ResponseEntity.ok(Map.of("status", "STARTED", "message", "시뮬레이션이 시작되었습니다."));
    }

    @PostMapping("/pause")
    public ResponseEntity<Map<String, Object>> pause() {
        simulationEngine.pause();
        return ResponseEntity.ok(Map.of("status", "PAUSED", "message", "시뮬레이션이 일시정지되었습니다."));
    }

    @PostMapping("/step")
    public ResponseEntity<TickResultDto> step() {
        TickResultDto result = simulationEngine.step();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> reset() {
        simulationEngine.reset();
        return ResponseEntity.ok(Map.of("status", "RESET", "message", "시뮬레이션이 초기화되었습니다."));
    }

    @PostMapping("/config")
    public ResponseEntity<Map<String, Object>> updateConfig(@RequestBody ControlCommandDto command) {
        simulationEngine.updateConfig(command);
        return ResponseEntity.ok(Map.of("status", "CONFIG_UPDATED", "config", runwayScheduler.getConfig()));
    }

    @PostMapping("/runways/{id}/toggle-closure")
    public ResponseEntity<Map<String, Object>> toggleRunwayClosure(@PathVariable("id") int id) {
        runwayScheduler.toggleRunwayClosure(id);
        Runway runway = runwayScheduler.getRunwayById(id);
        return ResponseEntity.ok(Map.of(
                "runwayId", id,
                "isClosed", runway != null && runway.isClosed()
        ));
    }

    @PostMapping("/runways/{id}/toggle-direction")
    public ResponseEntity<Map<String, Object>> toggleRunwayDirection(
            @PathVariable("id") int id,
            @RequestParam("operation") String operation) {
        runwayScheduler.toggleRunwayDirection(id, operation);
        Runway runway = runwayScheduler.getRunwayById(id);
        return ResponseEntity.ok(Map.of(
                "runwayId", id,
                "allowLanding", runway != null && runway.isAllowLanding(),
                "allowTakeoff", runway != null && runway.isAllowTakeoff()
        ));
    }

    @PostMapping("/runways/emergency")
    public ResponseEntity<Map<String, Object>> setEmergencyRunway(@RequestParam("runwayId") int runwayId) {
        runwayScheduler.setEmergencyRunwayId(runwayId);
        return ResponseEntity.ok(Map.of(
                "emergencyRunwayId", runwayScheduler.getConfig().getEmergencyRunwayId()
        ));
    }

    @PostMapping("/runways/add")
    public ResponseEntity<Map<String, Object>> addRunway(@RequestBody AddRunwayRequestDto request) {
        Runway runway = runwayScheduler.addNewRunway(request.getName(), request.getType(), request.getCrossingRunwayId());
        return ResponseEntity.ok(Map.of(
                "status", "RUNWAY_ADDED",
                "runway", runway
        ));
    }

    @PostMapping("/spawn")
    public ResponseEntity<Map<String, Object>> spawnFlight(@RequestBody SpawnFlightRequestDto request) {
        Flight flight = simulationEngine.spawnFlight(request);
        return ResponseEntity.ok(Map.of(
                "status", "FLIGHT_SPAWNED",
                "flight", flight
        ));
    }
}
