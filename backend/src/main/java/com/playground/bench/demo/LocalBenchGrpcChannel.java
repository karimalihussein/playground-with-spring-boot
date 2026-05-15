package com.playground.bench.demo;

import com.playground.bench.grpc.GrpcServerLifecycle;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import jakarta.annotation.PreDestroy;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Component;

/**
 * Shared cleartext channel to the in-process {@link GrpcServerLifecycle} listener.
 * <p>
 * The browser cannot open a gRPC-Netty HTTP/2 connection with protobuf from JavaScript (that needs
 * <a href="https://grpc.io/docs/platforms/web/">gRPC-Web</a> and a proxy). This channel lets Spring proxy
 * real unary + server-streaming RPCs over ordinary HTTP (JSON / SSE) for teaching visuals.
 */
@Component
public class LocalBenchGrpcChannel {

	private final ManagedChannel channel;

	public LocalBenchGrpcChannel(GrpcServerLifecycle grpcServerLifecycle) {
		this.channel = ManagedChannelBuilder
				.forAddress("localhost", grpcServerLifecycle.getPort())
				.usePlaintext()
				.build();
	}

	public ManagedChannel channel() {
		return channel;
	}

	@PreDestroy
	public void shutdown() throws InterruptedException {
		channel.shutdown();
		if (!channel.awaitTermination(3, TimeUnit.SECONDS)) {
			channel.shutdownNow();
		}
	}
}
