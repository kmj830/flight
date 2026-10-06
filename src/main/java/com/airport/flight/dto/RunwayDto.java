package com.airport.flight.dto;

import com.airport.flight.domain.Runway;
import com.airport.flight.domain.RunwayType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RunwayDto {
    private int id;
    private String name;
    private RunwayType type;
    private boolean isClosed;
    private Integer crossingRunwayId;
    private boolean allowLanding;
    private boolean allowTakeoff;
    private FlightDto currentFlight;
    private String lastOperation;

    public static RunwayDto fromDomain(Runway runway) {
        if (runway == null) return null;
        return RunwayDto.builder()
                .id(runway.getId())
                .name(runway.getName())
                .type(runway.getType())
                .isClosed(runway.isClosed())
                .crossingRunwayId(runway.getCrossingRunwayId())
                .allowLanding(runway.isAllowLanding())
                .allowTakeoff(runway.isAllowTakeoff())
                .currentFlight(FlightDto.fromDomain(runway.getCurrentFlight()))
                .lastOperation(runway.getLastOperation())
                .build();
    }
}
