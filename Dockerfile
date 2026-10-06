# 1단계: 빌드 스테이지
FROM gradle:8.10.2-jdk21 AS builder
WORKDIR /app
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./
RUN chmod +x gradlew
COPY src src
RUN ./gradlew bootJar --no-daemon -x test

# 2단계: 실행 스테이지 (경량 Eclipse Temurin JRE 21)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Cloud Run 기본 포트 환경변수 (8080)
ENV PORT=8080
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=$PORT -jar app.jar"]
