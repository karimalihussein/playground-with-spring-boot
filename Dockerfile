# Multi-stage: Vite client build into backend static, then Spring Boot fat jar (Java 21).
FROM node:22-bookworm-slim AS web
WORKDIR /repo
# Directory layout must match vite `outDir: ../backend/src/main/resources/static`
COPY backend/src/main/resources/static ./backend/src/main/resources/static
COPY frontend ./frontend
WORKDIR /repo/frontend
RUN npm install --no-audit --no-fund && npm run build

FROM eclipse-temurin:21-jdk AS builder
WORKDIR /repo
COPY backend/pom.xml backend/
COPY backend/src backend/src
COPY backend/.mvn backend/.mvn
COPY backend/mvnw backend/
COPY --from=web /repo/backend/src/main/resources/static backend/src/main/resources/static
WORKDIR /repo/backend
RUN chmod +x mvnw && ./mvnw -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /repo/backend/target/main-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080 9090
ENV SPRING_PROFILES_ACTIVE=bench
ENTRYPOINT ["java","-jar","/app/app.jar"]
