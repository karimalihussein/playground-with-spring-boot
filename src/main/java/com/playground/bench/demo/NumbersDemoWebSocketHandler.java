package com.playground.bench.demo;

import com.playground.bench.service.NumberBenchService;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import tools.jackson.databind.ObjectMapper;

/**
 * Educational WebSocket: one persistent duplex TCP connection upgraded to WS, then many JSON text “frames”
 * simulating server push (compare to SSE which is simplex from server, and to gRPC server-stream).
 */
@Component
public class NumbersDemoWebSocketHandler extends TextWebSocketHandler {

	private static final ExecutorService EXEC = Executors.newVirtualThreadPerTaskExecutor();

	private final NumberBenchService numberBenchService;
	private final ObjectMapper objectMapper;

	public NumbersDemoWebSocketHandler(NumberBenchService numberBenchService, ObjectMapper objectMapper) {
		this.numberBenchService = numberBenchService;
		this.objectMapper = objectMapper;
	}

	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		sendJson(
				session,
				Map.of(
						"type", "lifecycle",
						"state", "WEBSOCKET_OPEN",
						"note",
						"HTTP Upgrade completed — one socket is now full-duplex for many lightweight messages."));
	}

	@Override
	protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
		@SuppressWarnings("unchecked")
		Map<String, Object> body = objectMapper.readValue(message.getPayload(), Map.class);
		String cmd = String.valueOf(body.getOrDefault("cmd", ""));
		switch (cmd) {
			case "ping" -> sendJson(session, Map.of("type", "pong", "ts", System.currentTimeMillis()));
			case "stream" -> startStream(session, body);
			default -> sendJson(
					session, Map.of("type", "error", "message", "unknown cmd: " + cmd));
		}
	}

	private void startStream(WebSocketSession session, Map<String, Object> body) {
		int count = toInt(body.get("count"), 12);
		int frameDelayMs = Math.max(0, Math.min(2000, toInt(body.get("frameDelayMs"), 0)));

		AtomicBoolean busy = (AtomicBoolean) session.getAttributes()
				.computeIfAbsent("streamBusy", k -> new AtomicBoolean(false));
		if (!busy.compareAndSet(false, true)) {
			sendJsonSafe(session, Map.of("type", "error", "message", "stream already running"));
			return;
		}

		EXEC.submit(() -> {
			try {
				int n = numberBenchService.normalizeAndValidate(count);
				sendJsonSafe(
						session,
						Map.of(
								"type",
								"lifecycle",
								"state",
								"STREAM_STARTED",
								"chunksPlanned",
								n));

				for (int i = 0; i < n; i++) {
					if (!session.isOpen()) {
						break;
					}
					int index = i + 1;
					long square = (long) index * index;
					sendJsonSafe(
							session,
							Map.of(
									"type",
									"chunk",
									"index",
									index,
									"square",
									square,
									"duplexNote",
									"Same socket: browser can send {cmd:ping} while chunks arrive."));
					if (frameDelayMs > 0) {
						Thread.sleep(frameDelayMs);
					}
				}
				sendJsonSafe(
						session,
						Map.of("type", "complete", "chunks", n, "lifecycle", "STREAM_END"));
			}
			catch (IllegalArgumentException ex) {
				sendJsonSafe(session, Map.of("type", "error", "message", ex.getMessage()));
			}
			catch (InterruptedException ie) {
				Thread.currentThread().interrupt();
				sendJsonSafe(session, Map.of("type", "error", "message", "interrupted"));
			}
			finally {
				busy.set(false);
			}
		});
	}

	private static int toInt(Object o, int dflt) {
		if (o instanceof Number n) {
			return n.intValue();
		}
		try {
			return Integer.parseInt(String.valueOf(o));
		}
		catch (Exception e) {
			return dflt;
		}
	}

	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
		session.getAttributes().remove("streamBusy");
	}

	private void sendJson(WebSocketSession session, Map<String, ?> payload) throws IOException {
		session.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
	}

	private void sendJsonSafe(WebSocketSession session, Map<String, ?> payload) {
		try {
			if (session.isOpen()) {
				sendJson(session, payload);
			}
		}
		catch (IOException ignore) {
			// demo only
		}
	}
}
