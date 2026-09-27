package com.game.server.network.http;

import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelFutureListener;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.DefaultFullHttpResponse;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.HttpVersion;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

public final class HealthHttpHandler extends SimpleChannelInboundHandler<FullHttpRequest> {

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, FullHttpRequest request) {
        if (!"/health".equals(request.uri())) {
            writeJson(ctx, HttpResponseStatus.NOT_FOUND, "{\"status\":\"DOWN\"}");
            return;
        }

        String body =
                """
                {"status":"UP","service":"flashshot-game-server","timestamp":"%s"}
                """
                        .formatted(Instant.now().toString())
                        .trim();
        writeJson(ctx, HttpResponseStatus.OK, body);
    }

    private static void writeJson(ChannelHandlerContext ctx, HttpResponseStatus status, String body) {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        DefaultFullHttpResponse response = new DefaultFullHttpResponse(
                HttpVersion.HTTP_1_1, status, Unpooled.wrappedBuffer(bytes));
        response.headers().set(HttpHeaderNames.CONTENT_TYPE, "application/json; charset=utf-8");
        response.headers().set(HttpHeaderNames.CONTENT_LENGTH, bytes.length);
        ctx.writeAndFlush(response).addListener(ChannelFutureListener.CLOSE);
    }
}
