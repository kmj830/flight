package com.airport.flight.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ControlCommandDto {
    private String action; // START, PAUSE, STEP, RESET, SET_CONFIG
    private Long tickIntervalMs;
    private Boolean xCrossingMutexEnabled;
    private Integer emergencyRunwayId;
}
