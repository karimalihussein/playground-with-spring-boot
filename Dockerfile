# Multi-stage build: compile Protobuf + Spring Boot fat jar, then run Java 21 JRE.
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /workspace
COPY pom.xml .
COPY src ./src
COPY .mvn ./.mvn
COPY mvnw .
RUN chmod +x mvnw && ./mvnw -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /workspace/target/main-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080 9090
ENV SPRING_PROFILES_ACTIVE=bench
ENTRYPOINT ["java","-jar","/app/app.jar"]
