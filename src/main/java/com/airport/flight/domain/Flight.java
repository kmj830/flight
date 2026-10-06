package com.airport.flight.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Flight {
    private int id;                     // 짝수: 착륙, 홀수: 이륙
    private FlightType type;
    private int fuel;                   // 잔여 체공 시간 (착륙 비행기)
    private int initialFuel;
    private int waitTime;               // 대기 시간
    private FlightStatus status;
    private String queueName;           // 소속 큐 이름 (예: L_Q1, T_Q2)
    private Integer assignedRunwayId;   // 현재 배정된 활주로 번호
    private boolean emergency;          // 긴급 착륙 여부
    private long arrivedTick;           // 시스템 진입 틱

    public void decrementFuel() {
        if (this.fuel > 0) {
            this.fuel--;
        }
    }

    public void incrementWaitTime() {
        this.waitTime++;
    }
}
