package com.game.api.infrastructure.health;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class HealthControllerTest {

    private final HealthController controller = new HealthController();

    @Test
    void healthEndpointReturnsUp() {
        var body = controller.health();
        assertThat(body).containsEntry("status", "UP");
        assertThat(body).containsEntry("service", "flashshot-api-server");
        assertThat(body).containsKey("timestamp");
    }
}
