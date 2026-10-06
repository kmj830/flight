package com.airport.flight.dto;

import com.airport.flight.domain.Flight;
import com.airport.flight.domain.FlightStatus;
import com.airport.flight.domain.FlightType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlightDto {
    private int id;
    private FlightType type;
    private int fuel;
    private int initialFuel;
    private int waitTime;
    private FlightStatus status;
    private String queueName;
    private Integer assignedRunwayId;
    private boolean emergency;
    private long arrivedTick;

    public static FlightDto fromDomain(Flight flight) {
        if (flight == null) return null;
        return FlightDto.builder()
                .id(flight.getId())
                .type(flight.getType())
                .fuel(flight.getFuel())
                .initialFuel(flight.getInitialFuel())
                .waitTime(flight.getWaitTime())
                .status(flight.getStatus())
                .queueName(flight.getQueueName())
                .assignedRunwayId(flight.getAssignedRunwayId())
                .emergency(flight.isEmergency())
                .arrivedTick(flight.getArrivedTick())
                .build();
    }
}
