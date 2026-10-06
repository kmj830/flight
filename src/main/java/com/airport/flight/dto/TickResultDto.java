package com.airport.flight.dto;

import com.airport.flight.domain.AirportMetrics;
import com.airport.flight.domain.SimulationConfig;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TickResultDto {
    private long tick;
    @Builder.Default
    private List<RunwayDto> runways = new ArrayList<>();
    @Builder.Default
    private Map<String, List<FlightDto>> queues = new HashMap<>();
    @Builder.Default
    private List<String> events = new ArrayList<>();
    private AirportMetrics metrics;
    @Builder.Default
    private List<FlightDto> emergencyFlights = new ArrayList<>();
    @Builder.Default
    private List<FlightDto> crashedFlights = new ArrayList<>();
    private SimulationConfig config;
}
