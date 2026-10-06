package com.airport.flight.dto;

import com.airport.flight.domain.RunwayType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddRunwayRequestDto {
    private String name;
    private RunwayType type;
    private Integer crossingRunwayId;
}
