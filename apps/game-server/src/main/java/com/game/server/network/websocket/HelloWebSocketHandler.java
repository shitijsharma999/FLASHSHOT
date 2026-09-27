package com.game.server.network.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.game.server.protocol.ProtocolConstants;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import java.util.LinkedHashMap;
import java.util.Map;

public final class HelloWebSocketHandler extends SimpleChannelInboundHandler<WebSocketFrame> {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, WebSocketFrame frame) throws Exception {
        if (!(frame instanceof TextWebSocketFrame textFrame)) {
            return;
        }

        JsonNode root = MAPPER.readTree(textFrame.text());
        int type = root.path("type").asInt(-1);
        if (type != ProtocolConstants.PACKET_HELLO) {
            ctx.close();
            return;
        }

        int protocolVersion = root.path("protocolVersion").asInt(-1);
        if (protocolVersion != ProtocolConstants.PROTOCOL_VERSION) {
            ctx.close();
            return;
        }

        Map<String, Object> ack = new LinkedHashMap<>();
        ack.put("type", ProtocolConstants.PACKET_HELLO_ACK);
        ack.put("protocolVersion", ProtocolConstants.PROTOCOL_VERSION);
        ack.put("serverTimeMs", System.currentTimeMillis());

        ctx.writeAndFlush(new TextWebSocketFrame(MAPPER.writeValueAsString(ack)));
    }
}
