package com.airport.flight.dto;

import com.airport.flight.domain.FlightType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpawnFlightRequestDto {
    private FlightType type;
    private Integer fuel; // null이면 기본값, 긴급스폰 시 0 또는 1 지정 가능
    private String targetQueue; // null이면 로드밸런싱
}
