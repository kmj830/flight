package com.airport.flight.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Runway {
    private int id;
    private String name;
    private RunwayType type;
    @Builder.Default
    private boolean isClosed = false;
    private Integer crossingRunwayId;
    @Builder.Default
    private boolean allowLanding = true;
    @Builder.Default
    private boolean allowTakeoff = true;
    private Flight currentFlight;
    @Builder.Default
    private String lastOperation = "IDLE";

    public void clearFlight() {
        this.currentFlight = null;
        this.lastOperation = "IDLE";
    }

    public void assignFlight(Flight flight, String operationDescription) {
        this.currentFlight = flight;
        this.lastOperation = operationDescription;
    }
}
