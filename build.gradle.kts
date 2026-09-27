plugins {
    base
}

subprojects {
    repositories {
        mavenCentral()
    }
}

tasks.named("check") {
    dependsOn(subprojects.map { it.tasks.named("check") })
}

tasks.named("build") {
    dependsOn(subprojects.map { it.tasks.named("build") })
}
