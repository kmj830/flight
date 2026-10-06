package com.airport.flight.controller;

import com.airport.flight.dto.ControlCommandDto;
import com.airport.flight.dto.SpawnFlightRequestDto;
import com.airport.flight.engine.SimulationEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class SimulationSocketController {

    private final SimulationEngine simulationEngine;

    @MessageMapping("/control")
    public void handleControlMessage(@Payload ControlCommandDto command) {
        log.info("Received socket control command: {}", command);
        if (command == null || command.getAction() == null) return;

        switch (command.getAction().toUpperCase()) {
            case "START" -> simulationEngine.start();
            case "PAUSE" -> simulationEngine.pause();
            case "STEP" -> simulationEngine.step();
            case "RESET" -> simulationEngine.reset();
            case "SET_CONFIG" -> simulationEngine.updateConfig(command);
            default -> log.warn("Unknown socket command: {}", command.getAction());
        }
    }

    @MessageMapping("/spawn")
    public void handleSpawnMessage(@Payload SpawnFlightRequestDto request) {
        log.info("Received socket spawn request: {}", request);
        simulationEngine.spawnFlight(request);
    }
}
