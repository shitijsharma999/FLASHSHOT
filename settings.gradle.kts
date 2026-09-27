plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "0.10.0"
}

rootProject.name = "flashshot"

include("game-server", "api-server")

project(":game-server").projectDir = file("apps/game-server")
project(":api-server").projectDir = file("apps/api-server")
