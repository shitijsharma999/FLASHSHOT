plugins {
    application
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

dependencies {
    implementation("io.netty:netty-all:4.2.18.Final")
    implementation("com.fasterxml.jackson.core:jackson-databind:2.20.0")

    testImplementation(platform("org.junit:junit-bom:5.13.4"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

application {
    mainClass = "com.game.server.bootstrap.GameServerMain"
}

tasks.test {
    useJUnitPlatform()
}

tasks.jar {
    archiveFileName.set("game-server.jar")
    manifest {
        attributes["Main-Class"] = "com.game.server.bootstrap.GameServerMain"
    }
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
    from(configurations.runtimeClasspath.get().map { if (it.isDirectory) it else zipTree(it) })
}

tasks.withType<JavaCompile>().configureEach {
    options.encoding = "UTF-8"
    options.release = 25
}
