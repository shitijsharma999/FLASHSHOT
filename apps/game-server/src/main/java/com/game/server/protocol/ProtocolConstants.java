package com.game.server.protocol;

public final class ProtocolConstants {

    public static final int PROTOCOL_VERSION = 1;
    public static final int PACKET_HELLO = 0x01;
    public static final int PACKET_HELLO_ACK = 0x02;

    private ProtocolConstants() {}
}
