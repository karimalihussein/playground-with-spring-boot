package com.playground.bench.rest;

import com.playground.bench.metrics.BenchStreamTelemetry;
import com.playground.bench.service.NumberBenchService;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import tools.jackson.databind.ObjectMapper;

/**
 * REST “streaming” demo using <strong>Server-Sent Events</strong> (one HTTP request → one long response
 * with many {@code data:} lines). This is the usual browser-friendly cousin of “server push”, but it is
 * <em>not</em> gRPC: still HTTP semantics + text frames at the app layer (often chunked transfer).
 * <p>
 * We expose both {@code /rest/stream/...} (clear name) and {@code /grpc/stream/...} as an educational alias
 * because beginners often conflate “streaming URL path” with “gRPC streaming protocol”.
 */
@RestController
public class StreamNumbersRestController {

	private static final Logger log = LoggerFactory.getLogger(StreamNumbersRestController.class);

	private final NumberBenchService numberBenchService;
	private final ObjectMapper objectMapper;
	private final BenchStreamTelemetry telemetry;

	/** Artificial delay between SSE events (milliseconds). Default 0 = as fast as the CPU allows. */
	private final int delayMsBetweenEvents;

	public StreamNumbersRestController(
			NumberBenchService numberBenchService,
			ObjectMapper objectMapper,
			BenchStreamTelemetry telemetry,
			@Value("${bench.stream.sse-event-delay-ms:0}") int delayMsBetweenEvents) {
		this.numberBenchService = numberBenchService;
		this.objectMapper = objectMapper;
		this.telemetry = telemetry;
		this.delayMsBetweenEvents = delayMsBetweenEvents;
	}

	/**
	 * SSE: JSON lines as {@code text/event-stream}. Suitable for “eyes on the wire” with {@code curl -N}.
	 * ApacheBench downloads the whole response body; it does not count individual SSE events as “requests”.
	 */
	@GetMapping(path = {"/rest/stream/{count}", "/grpc/stream/{count}"}, produces = MediaType.TEXT_EVENT_STREAM_VALUE)
	public SseEmitter streamSquares(@PathVariable("count") int count) {
		SseEmitter emitter = new SseEmitter(TimeUnit.MINUTES.toMillis(5));
		final String label = "REST-SSE numbers";
		telemetry.sseStreamOpened(label);
		final AtomicBoolean ended = new AtomicBoolean();
		Runnable endOnce = () -> {
			if (ended.compareAndSet(false, true)) {
				telemetry.sseStreamClosed(label);
			}
		};
		emitter.onCompletion(endOnce);
		emitter.onError(e -> {
			log.debug("SSE error: {}", e.toString());
			endOnce.run();
		});
		emitter.onTimeout(() -> {
			log.warn("SSE timeout");
			endOnce.run();
			emitter.complete();
		});

		CompletableFuture.runAsync(() -> {
			try {
				int n = numberBenchService.normalizeAndValidate(count);
				for (int i = 0; i < n; i++) {
					int index = i + 1;
					long square = (long) index * index;
					String json = objectMapper.writeValueAsString(new StreamNumberEvent(index, square));
					emitter.send(SseEmitter.event().name("number").id(Integer.toString(index)).data(json));
					if (delayMsBetweenEvents > 0) {
						Thread.sleep(delayMsBetweenEvents);
					}
				}
				emitter.complete();
			}
			catch (IllegalArgumentException ex) {
				try {
					emitter.send(SseEmitter.event().name("error").data(ex.getMessage()));
				}
				catch (Exception ignore) {
					// fall through
				}
				emitter.completeWithError(ex);
			}
			catch (Exception ex) {
				emitter.completeWithError(ex);
			}
		});

		return emitter;
	}

	/** Minimal JSON payload per SSE event (mirrors gRPC {@code NumberChunk} spirit). */
	private record StreamNumberEvent(int index, long square) {
	}
}
