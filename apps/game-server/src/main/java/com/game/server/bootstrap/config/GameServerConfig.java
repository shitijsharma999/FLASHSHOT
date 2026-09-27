package com.game.server.bootstrap.config;

public record GameServerConfig(int httpPort, int wsPort, String wsPath) {

    public GameServerConfig {
        if (httpPort < 1 || httpPort > 65535) {
            throw new IllegalArgumentException("Invalid HTTP port: " + httpPort);
        }
        if (wsPort < 1 || wsPort > 65535) {
            throw new IllegalArgumentException("Invalid WebSocket port: " + wsPort);
        }
        if (wsPath == null || wsPath.isBlank() || !wsPath.startsWith("/")) {
            throw new IllegalArgumentException("WebSocket path must start with /");
        }
    }

    public static GameServerConfig fromEnvironment() {
        int httpPort = Integer.parseInt(System.getenv().getOrDefault("GAME_SERVER_HTTP_PORT", "9091"));
        int wsPort = Integer.parseInt(System.getenv().getOrDefault("GAME_SERVER_WS_PORT", "9090"));
        String wsPath = System.getenv().getOrDefault("GAME_SERVER_WS_PATH", "/ws");
        return new GameServerConfig(httpPort, wsPort, wsPath);
    }
}
