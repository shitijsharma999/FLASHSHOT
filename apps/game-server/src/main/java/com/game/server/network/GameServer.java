package com.game.server.network;

import com.game.server.bootstrap.config.GameServerConfig;
import com.game.server.network.http.HealthHttpHandler;
import com.game.server.network.websocket.HelloWebSocketHandler;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.Channel;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.http.HttpObjectAggregator;
import io.netty.handler.codec.http.HttpServerCodec;
import io.netty.handler.codec.http.websocketx.WebSocketServerProtocolHandler;
import io.netty.handler.logging.LogLevel;
import io.netty.handler.logging.LoggingHandler;

public final class GameServer implements AutoCloseable {

    private final GameServerConfig config;
    private final EventLoopGroup bossGroup = new NioEventLoopGroup(1);
    private final EventLoopGroup workerGroup = new NioEventLoopGroup();
    private Channel httpChannel;
    private Channel wsChannel;

    public GameServer(GameServerConfig config) {
        this.config = config;
    }

    public io.netty.channel.ChannelFuture start() throws InterruptedException {
        httpChannel = bindHttpHealth(config.httpPort());
        wsChannel = bindWebSocket(config.wsPort(), config.wsPath());
        return wsChannel.newSucceededFuture();
    }

    private Channel bindHttpHealth(int port) throws InterruptedException {
        ServerBootstrap bootstrap = new ServerBootstrap()
                .group(bossGroup, workerGroup)
                .channel(NioServerSocketChannel.class)
                .handler(new LoggingHandler(LogLevel.INFO))
                .childHandler(new ChannelInitializer<SocketChannel>() {
                    @Override
                    protected void initChannel(SocketChannel ch) {
                        ch.pipeline()
                                .addLast(new HttpServerCodec())
                                .addLast(new HttpObjectAggregator(8192))
                                .addLast(new HealthHttpHandler());
                    }
                });

        return bootstrap.bind(port).sync().channel();
    }

    private Channel bindWebSocket(int port, String wsPath) throws InterruptedException {
        ServerBootstrap bootstrap = new ServerBootstrap()
                .group(bossGroup, workerGroup)
                .channel(NioServerSocketChannel.class)
                .handler(new LoggingHandler(LogLevel.INFO))
                .childHandler(new ChannelInitializer<SocketChannel>() {
                    @Override
                    protected void initChannel(SocketChannel ch) {
                        ch.pipeline()
                                .addLast(new HttpServerCodec())
                                .addLast(new HttpObjectAggregator(65536))
                                .addLast(new WebSocketServerProtocolHandler(wsPath, null, true))
                                .addLast(new HelloWebSocketHandler());
                    }
                });

        return bootstrap.bind(port).sync().channel();
    }

    @Override
    public void close() {
        if (httpChannel != null) {
            httpChannel.close();
        }
        if (wsChannel != null) {
            wsChannel.close();
        }
        bossGroup.shutdownGracefully();
        workerGroup.shutdownGracefully();
    }
}
