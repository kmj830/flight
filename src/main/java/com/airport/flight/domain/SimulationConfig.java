package com.airport.flight.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulationConfig {
    @Builder.Default
    private long tickIntervalMs = 1000;
    @Builder.Default
    private boolean xCrossingMutexEnabled = true;
    @Builder.Default
    private int emergencyRunwayId = 3;
    @Builder.Default
    private int landingArrivalMin = 0;
    @Builder.Default
    private int landingArrivalMax = 3;
    @Builder.Default
    private int takeoffArrivalMin = 0;
    @Builder.Default
    private int takeoffArrivalMax = 3;
    @Builder.Default
    private int fuelMin = 1;
    @Builder.Default
    private int fuelMax = 10;
    @Builder.Default
    private boolean running = false;
}
