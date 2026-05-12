package com.playground.bench.grpc;

import io.grpc.Server;
import io.grpc.ServerBuilder;
import jakarta.annotation.PreDestroy;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Starts a second listener alongside Spring MVC (port 8080): a gRPC/HTTP/2 server (default port 9090).
 * <p>
 * {@code bench.grpc.port=0} binds an ephemeral port (handy in tests); after {@link Server#start()},
 * {@link Server#getPort()} is the real port.
 */
@Component
public class GrpcServerLifecycle {

	private static final Logger log = LoggerFactory.getLogger(GrpcServerLifecycle.class);

	private final Server server;

	public GrpcServerLifecycle(
			NumberBenchGrpcService numberBenchGrpcService,
			@Value("${bench.grpc.port:9090}") int port) throws IOException {
		// grpc-netty-shaded wires Netty behind ServerBuilder; default is cleartext h2c for local education.
		this.server = ServerBuilder.forPort(port).addService(numberBenchGrpcService).build().start();
		log.info("gRPC server (NumberBench) listening on port {}", this.server.getPort());
	}

	public int getPort() {
		return server.getPort();
	}

	@PreDestroy
	public void stop() {
		server.shutdown();
	}
}
