package com.airport.flight;

import com.airport.flight.controller.SimulationRestController;
import com.airport.flight.domain.FlightType;
import com.airport.flight.dto.SpawnFlightRequestDto;
import com.airport.flight.engine.QueueManager;
import com.airport.flight.engine.RunwayScheduler;
import com.airport.flight.engine.SimulationEngine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SimulationRestControllerTest {

    private MockMvc mockMvc;
    private SimulationEngine simulationEngine;
    private RunwayScheduler runwayScheduler;
    private QueueManager queueManager;

    @BeforeEach
    void setUp() {
        queueManager = new QueueManager();
        runwayScheduler = new RunwayScheduler(queueManager);
        SimpMessagingTemplate messagingTemplate = mock(SimpMessagingTemplate.class);
        simulationEngine = new SimulationEngine(queueManager, runwayScheduler, messagingTemplate);
        SimulationRestController controller = new SimulationRestController(simulationEngine, runwayScheduler);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("시뮬레이션 상태 조회, 스텝 실행, 일시정지, 리셋 API가 정상 작동한다")
    void testSimulationRestApiFlow() throws Exception {
        // 1. 상태 조회
        mockMvc.perform(get("/api/simulation/state"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.runways").isArray())
                .andExpect(jsonPath("$.queues").isMap());

        // 2. 단일 스텝 실행
        mockMvc.perform(post("/api/simulation/step"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tick").isNumber());

        // 3. 시작
        mockMvc.perform(post("/api/simulation/start"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("STARTED"));

        // 4. 일시정지
        mockMvc.perform(post("/api/simulation/pause"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAUSED"));

        // 5. 활주로 폐쇄 토글
        mockMvc.perform(post("/api/simulation/runways/1/toggle-closure"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.runwayId").value(1))
                .andExpect(jsonPath("$.isClosed").value(true));

        // 6. 비상 비행기 수동 스폰
        String spawnJson = """
                {
                    "type": "LANDING",
                    "fuel": 0
                }
                """;
        mockMvc.perform(post("/api/simulation/spawn")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(spawnJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FLIGHT_SPAWNED"));

        // 7. 리셋
        mockMvc.perform(post("/api/simulation/reset"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESET"));
    }
}
