package com.game.server.protocol;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class ProtocolConstantsTest {

    @Test
    void protocolVersionMatchesSharedContract() {
        assertEquals(1, ProtocolConstants.PROTOCOL_VERSION);
    }
}
