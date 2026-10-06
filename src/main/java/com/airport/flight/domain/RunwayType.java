package com.airport.flight.domain;

public enum RunwayType {
    ALL,              // 이착륙 모두 가능 (기본: 활주로 1, 2)
    TAKEOFF_ONLY,     // 이륙 전용 (기본: 활주로 3)
    EMERGENCY_ONLY    // 비상 착륙 전용
}
