package com.game.server.bootstrap;

import com.game.server.bootstrap.config.GameServerConfig;
import com.game.server.network.GameServer;

public final class GameServerMain {

    private GameServerMain() {}

    public static void main(String[] args) throws Exception {
        GameServerConfig config = GameServerConfig.fromEnvironment();
        GameServer server = new GameServer(config);
        Runtime.getRuntime().addShutdownHook(new Thread(server::close));
        server.start().sync();
    }
}
