package com.airport.flight;

import com.airport.flight.domain.Flight;
import com.airport.flight.domain.FlightType;
import com.airport.flight.engine.QueueManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class QueueManagerTest {

    private QueueManager queueManager;

    @BeforeEach
    void setUp() {
        queueManager = new QueueManager();
        queueManager.reset();
    }

    @Test
    @DisplayName("착륙 비행기는 짝수 정수 ID를 부여받고, 가장 대기열이 작은 큐로 균등 분배된다")
    void testLandingFlightIdAndLoadBalancing() {
        // Given & When: 4대의 착륙 비행기 생성
        Flight f1 = queueManager.addLandingFlight(5, 1);
        Flight f2 = queueManager.addLandingFlight(4, 1);
        Flight f3 = queueManager.addLandingFlight(6, 1);
        Flight f4 = queueManager.addLandingFlight(3, 1);

        // Then: 모든 ID는 짝수이며 1002부터 시작
        assertThat(f1.getId()).isEqualTo(1002);
        assertThat(f2.getId()).isEqualTo(1004);
        assertThat(f3.getId()).isEqualTo(1006);
        assertThat(f4.getId()).isEqualTo(1008);

        // 균등 분배 확인: 4개 큐(L_Q1 ~ L_Q4)에 각각 1대씩 배치되어야 함
        assertThat(queueManager.getLandingQueues().get("L_Q1")).hasSize(1);
        assertThat(queueManager.getLandingQueues().get("L_Q2")).hasSize(1);
        assertThat(queueManager.getLandingQueues().get("L_Q3")).hasSize(1);
        assertThat(queueManager.getLandingQueues().get("L_Q4")).hasSize(1);
    }

    @Test
    @DisplayName("이륙 비행기는 홀수 정수 ID를 부여받고, 3개 큐에 균등 분배된다")
    void testTakeoffFlightIdAndLoadBalancing() {
        // Given & When: 3대의 이륙 비행기 생성
        Flight f1 = queueManager.addTakeoffFlight(1);
        Flight f2 = queueManager.addTakeoffFlight(1);
        Flight f3 = queueManager.addTakeoffFlight(1);

        // Then: 모든 ID는 홀수이며 1001부터 시작
        assertThat(f1.getId()).isEqualTo(1001);
        assertThat(f2.getId()).isEqualTo(1003);
        assertThat(f3.getId()).isEqualTo(1005);

        // 3개 큐(T_Q1 ~ T_Q3)에 각 1대씩 배치
        assertThat(queueManager.getTakeoffQueues().get("T_Q1")).hasSize(1);
        assertThat(queueManager.getTakeoffQueues().get("T_Q2")).hasSize(1);
        assertThat(queueManager.getTakeoffQueues().get("T_Q3")).hasSize(1);
    }

    @Test
    @DisplayName("큐는 FIFO 원칙을 엄격히 준수한다")
    void testFifoQueueOrder() {
        // L_Q1에 강제로 순차 추가되는지 검증
        Flight f1 = queueManager.spawnCustomFlight(FlightType.LANDING, 10, "L_Q1", 1);
        Flight f2 = queueManager.spawnCustomFlight(FlightType.LANDING, 2, "L_Q1", 1);

        assertThat(queueManager.getLandingQueues().get("L_Q1").peekFirst()).isEqualTo(f1);
        assertThat(queueManager.getLandingQueues().get("L_Q1").peekLast()).isEqualTo(f2);
    }
}
