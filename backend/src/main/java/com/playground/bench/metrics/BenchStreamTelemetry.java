package com.playground.bench.metrics;

import java.util.concurrent.atomic.AtomicInteger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Lightweight counters for teaching “what is active right now?” — not production observability.
 * <p>
 * gRPC streaming maps to HTTP/2 streams; TCP is still shared. When consumers are slow, flow
 * control (window updates) applies before your {@code onNext} overloads the peer buffers — see
 * <a href="https://www.rfc-editor.org/rfc/rfc9113.html#name-flow-control">RFC 9113 (flow control)</a>.
 */
@Component
public class BenchStreamTelemetry {

	private static final Logger log = LoggerFactory.getLogger(BenchStreamTelemetry.class);

	private final AtomicInteger activeGrpcStreams = new AtomicInteger();
	private final AtomicInteger activeSseStreams = new AtomicInteger();

	/** gRPC streams currently open (server’s perspective: RPC handlers active). */
	public int grpcStreamOpened(String label) {
		int now = activeGrpcStreams.incrementAndGet();
		log.info("gRPC stream OPEN [{}], activeGrpcStreams={}", label, now);
		return now;
	}

	public void grpcStreamClosed(String label) {
		int now = activeGrpcStreams.decrementAndGet();
		log.info("gRPC stream CLOSE [{}], activeGrpcStreams={}", label, now);
	}

	/** One long-lived HTTP(S) response chunking events (SSE). HTTP/1.1 still typically uses one response stream. */
	public int sseStreamOpened(String label) {
		int now = activeSseStreams.incrementAndGet();
		log.info("SSE stream OPEN [{}], activeSseStreams={}", label, now);
		return now;
	}

	public void sseStreamClosed(String label) {
		int now = activeSseStreams.decrementAndGet();
		log.info("SSE stream CLOSE [{}], activeSseStreams={}", label, now);
	}

	public int activeGrpcStreams() {
		return activeGrpcStreams.get();
	}

	public int activeSseStreams() {
		return activeSseStreams.get();
	}
}
