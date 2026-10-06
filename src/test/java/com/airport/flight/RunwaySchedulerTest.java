package com.airport.flight;

import com.airport.flight.domain.*;
import com.airport.flight.dto.TickResultDto;
import com.airport.flight.engine.QueueManager;
import com.airport.flight.engine.RunwayScheduler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RunwaySchedulerTest {

    private QueueManager queueManager;
    private RunwayScheduler runwayScheduler;

    @BeforeEach
    void setUp() {
        queueManager = new QueueManager();
        queueManager.reset();
        runwayScheduler = new RunwayScheduler(queueManager);
        runwayScheduler.reset();
    }

    @Test
    @DisplayName("체공 가능 시간이 1인 비행기는 다음 틱에 0이 되며 활주로 3으로 최우선 긴급 착륙한다")
    void testEmergencyLandingToRunway3() {
        // Given: 연료가 1인 착륙 비행기를 L_Q1에 추가
        Flight flight = queueManager.spawnCustomFlight(FlightType.LANDING, 1, "L_Q1", 0);

        // When: 틱 진행 (연료가 1 -> 0으로 감소하고 긴급 착륙 대상 선정)
        TickResultDto result = runwayScheduler.processTick();

        // Then: 활주로 3에 긴급 착륙 배정되어야 함
        Runway r3 = runwayScheduler.getRunwayById(3);
        assertThat(r3.getCurrentFlight()).isNotNull();
        assertThat(r3.getCurrentFlight().getId()).isEqualTo(flight.getId());
        assertThat(r3.getCurrentFlight().getStatus()).isEqualTo(FlightStatus.EMERGENCY_LANDING);
        assertThat(runwayScheduler.getMetrics().getTotalEmergencyLandings()).isEqualTo(1);
        assertThat(runwayScheduler.getMetrics().getTotalCrashed()).isEqualTo(0);
    }

    @Test
    @DisplayName("긴급 비행기가 2대 이상일 때 활주로 3과 활주로 1(또는 2)에 순차 강제 할당된다")
    void testMultipleEmergencyLandings() {
        // Given: 연료 1인 비행기 2대를 각각 L_Q1, L_Q2에 배치
        Flight f1 = queueManager.spawnCustomFlight(FlightType.LANDING, 1, "L_Q1", 0);
        Flight f2 = queueManager.spawnCustomFlight(FlightType.LANDING, 1, "L_Q2", 0);

        // When: 틱 진행
        TickResultDto result = runwayScheduler.processTick();

        // Then: 활주로 3과 활주로 1(또는 2) 모두 비행기가 배정되어야 함
        assertThat(runwayScheduler.getMetrics().getTotalEmergencyLandings()).isEqualTo(2);
        assertThat(runwayScheduler.getMetrics().getTotalCrashed()).isEqualTo(0);

        Runway r3 = runwayScheduler.getRunwayById(3);
        Runway r1 = runwayScheduler.getRunwayById(1);
        Runway r2 = runwayScheduler.getRunwayById(2);

        // 활주로 3 및 (활주로 1 또는 2 중 하나)에 배정됨
        assertThat(r3.getCurrentFlight()).isNotNull();
        boolean eitherR1orR2 = (r1.getCurrentFlight() != null) || (r2.getCurrentFlight() != null);
        assertThat(eitherR1orR2).isTrue();
    }

    @Test
    @DisplayName("X자 교차 상호배제: 활주로 1이 사용 중이면 활주로 2는 동시 사용 불가")
    void testXCrossingMutex() {
        // Given: X자 교차 뮤텍스 활성화 상태에서 일반 착륙 2대 대기
        runwayScheduler.getConfig().setXCrossingMutexEnabled(true);
        Flight f1 = queueManager.spawnCustomFlight(FlightType.LANDING, 10, "L_Q1", 0);
        Flight f2 = queueManager.spawnCustomFlight(FlightType.LANDING, 10, "L_Q2", 0);

        // When: 틱 진행
        TickResultDto result = runwayScheduler.processTick();

        // Then: 활주로 1 또는 2 중 하나만 착륙에 사용되고, 다른 하나는 뮤텍스로 인해 비어있어야 함
        Runway r1 = runwayScheduler.getRunwayById(1);
        Runway r2 = runwayScheduler.getRunwayById(2);

        boolean oneAssignedOtherEmpty = (r1.getCurrentFlight() != null && r2.getCurrentFlight() == null)
                || (r1.getCurrentFlight() == null && r2.getCurrentFlight() != null);

        assertThat(oneAssignedOtherEmpty).isTrue();
    }

    @Test
    @DisplayName("긴급 비행기가 가용 활주로 수를 초과하거나 활주로 폐쇄로 배정 불가능할 경우 추락(Crash) 처리된다")
    void testEmergencyCrashWhenRunwayExceeded() {
        // Given: 활주로 1, 2, 3을 모두 폐쇄(Close)
        runwayScheduler.toggleRunwayClosure(1);
        runwayScheduler.toggleRunwayClosure(2);
        runwayScheduler.toggleRunwayClosure(3);

        // 긴급 비행기(연료 1) 생성
        Flight emergencyFlight = queueManager.spawnCustomFlight(FlightType.LANDING, 1, "L_Q1", 0);

        // When: 틱 진행
        TickResultDto result = runwayScheduler.processTick();

        // Then: 가용 활주로가 없으므로 추락 처리
        assertThat(runwayScheduler.getMetrics().getTotalCrashed()).isEqualTo(1);
        assertThat(result.getCrashedFlights()).hasSize(1);
        assertThat(result.getCrashedFlights().get(0).getId()).isEqualTo(emergencyFlight.getId());
    }

    @Test
    @DisplayName("일반 이륙 비행기는 이륙 전용인 활주로 3을 통해 우선 이륙 처리된다")
    void testTakeoffScheduling() {
        // Given: 이륙 비행기 1대 대기
        Flight takeoffFlight = queueManager.spawnCustomFlight(FlightType.TAKEOFF, 0, "T_Q3", 0);

        // When: 틱 진행
        TickResultDto result = runwayScheduler.processTick();

        // Then: 활주로 3을 통해 이륙 처리
        Runway r3 = runwayScheduler.getRunwayById(3);
        assertThat(r3.getCurrentFlight()).isNotNull();
        assertThat(r3.getCurrentFlight().getId()).isEqualTo(takeoffFlight.getId());
        assertThat(r3.getCurrentFlight().getStatus()).isEqualTo(FlightStatus.TAKING_OFF);
        assertThat(runwayScheduler.getMetrics().getTotalTookOff()).isEqualTo(1);
    }
}
