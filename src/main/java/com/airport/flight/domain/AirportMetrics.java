package com.airport.flight.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AirportMetrics {
    @Builder.Default
    private int totalLanded = 0;
    @Builder.Default
    private int totalTookOff = 0;
    @Builder.Default
    private int totalCrashed = 0;
    @Builder.Default
    private int totalEmergencyLandings = 0;
    @Builder.Default
    private long totalLandingWaitTime = 0;
    @Builder.Default
    private long totalTakeoffWaitTime = 0;
    @Builder.Default
    private double avgLandingWaitTime = 0.0;
    @Builder.Default
    private double avgTakeoffWaitTime = 0.0;

    public void recordLanding(int waitTime, boolean isEmergency) {
        this.totalLanded++;
        this.totalLandingWaitTime += waitTime;
        this.avgLandingWaitTime = (double) this.totalLandingWaitTime / this.totalLanded;
        if (isEmergency) {
            this.totalEmergencyLandings++;
        }
    }

    public void recordTakeoff(int waitTime) {
        this.totalTookOff++;
        this.totalTakeoffWaitTime += waitTime;
        this.avgTakeoffWaitTime = (double) this.totalTakeoffWaitTime / this.totalTookOff;
    }

    public void recordCrash() {
        this.totalCrashed++;
    }

    public void reset() {
        this.totalLanded = 0;
        this.totalTookOff = 0;
        this.totalCrashed = 0;
        this.totalEmergencyLandings = 0;
        this.totalLandingWaitTime = 0;
        this.totalTakeoffWaitTime = 0;
        this.avgLandingWaitTime = 0.0;
        this.avgTakeoffWaitTime = 0.0;
    }
}
