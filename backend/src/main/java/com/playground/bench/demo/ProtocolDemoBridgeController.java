package com.playground.bench.demo;

import com.playground.bench.rpc.proto.GenerateNumbersRequest;
import com.playground.bench.rpc.proto.GenerateNumbersResponse;
import com.playground.bench.rpc.proto.GenerateNumbersStreamRequest;
import com.playground.bench.rpc.proto.NumberBenchGrpc;
import com.playground.bench.rpc.proto.NumberChunk;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import io.grpc.StatusRuntimeException;
import io.grpc.stub.StreamObserver;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

/**
 * HTTP “window” onto real gRPC calls for browser demos.
 * <ul>
 *   <li>Unary: one blocking RPC → one JSON body (mirrors “one request, one big reply”).</li>
 *   <li>Streaming: async RPC → {@code text/event-stream} with one SSE event per {@link NumberChunk}.</li>
 * </ul>
 */
@RestController
public class ProtocolDemoBridgeController {

	private static final int DEFAULT_STUB_DEADLINE_SEC = 120;

	private final LocalBenchGrpcChannel channelHolder;
	private final ObjectMapper objectMapper;

	public ProtocolDemoBridgeController(LocalBenchGrpcChannel channelHolder, ObjectMapper objectMapper) {
		this.channelHolder = channelHolder;
		this.objectMapper = objectMapper;
	}

	/**
	 * Side-by-side JSON vs protobuf wire sizes for one small message (accurate bytes from Jackson + {@link NumberChunk}).
	 */
	@GetMapping(value = "/demo/edu/serialization", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<SerializationCompareDto> serializationCompare(
			@RequestParam(value = "square", defaultValue = "1024") long square) throws Exception {
		String jsonCompact = objectMapper.writeValueAsString(Map.of("square", square));
		byte[] jsonUtf8 = jsonCompact.getBytes(StandardCharsets.UTF_8);
		NumberChunk chunk = NumberChunk.newBuilder().setIndex(1).setSquare(square).build();
		byte[] proto = chunk.toByteArray();
		SerializationCompareDto dto = new SerializationCompareDto(
				jsonCompact,
				jsonUtf8.length,
				bytesToHex(proto),
				proto.length,
				"NumberChunk{index=1, square=" + square + "} wire format (field tags + varints).");
		return ResponseEntity.ok(dto);
	}

	/**
	 * Real gRPC unary {@code GenerateNumbers} over localhost, serialized to JSON for the UI.
	 */
	@GetMapping(value = "/demo/grpc/unary/{count}", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<GrpcUnaryDemoDto> grpcUnaryDemo(@PathVariable("count") int count) {
		final long t0 = System.nanoTime();
		final GenerateNumbersResponse resp;
		try {
			resp = NumberBenchGrpc.newBlockingStub(channelHolder.channel())
					.withDeadlineAfter(DEFAULT_STUB_DEADLINE_SEC, TimeUnit.SECONDS)
					.generateNumbers(GenerateNumbersRequest.newBuilder().setCount(count).build());
		}
		catch (StatusRuntimeException e) {
			throw translate(e);
		}
		final long t1 = System.nanoTime();

		int protobufBytes = resp.getSerializedSize();
		int onWireApprox = 5 + protobufBytes; // gRPC message deframer: 1-byte flags + 4-byte length + payload

		List<Long> squares = new ArrayList<>(resp.getSquaresCount());
		for (long v : resp.getSquaresList()) {
			squares.add(v);
		}

		GrpcUnaryDemoDto body = new GrpcUnaryDemoDto(
				resp.getCount(),
				squares,
				protobufBytes,
				onWireApprox,
				t1 - t0);
		return ResponseEntity.ok()
				.header("X-Demo-Grpc-Unary-Protobuf-Bytes", Integer.toString(protobufBytes))
				.header("X-Demo-Grpc-Unary-Server-Processing-Nanos", Long.toString(t1 - t0))
				.body(body);
	}

	/**
	 * Runs real server-streaming RPC {@code GenerateNumbersStream} and forwards each protobuf message as an
	 * SSE event. Optional {@code emitDelayMs} slows only the <em>HTTP/SSE layer</em> so learners can see
	 * chunks draw in the UI without changing core service logic.
	 */
	@GetMapping(path = "/demo/grpc/stream/{count}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
	public org.springframework.web.servlet.mvc.method.annotation.SseEmitter grpcStreamDemo(
			@PathVariable("count") int count,
			@RequestParam(value = "emitDelayMs", defaultValue = "0") int emitDelayMs) {
		org.springframework.web.servlet.mvc.method.annotation.SseEmitter emitter =
				new org.springframework.web.servlet.mvc.method.annotation.SseEmitter(TimeUnit.MINUTES.toMillis(5));

		NumberBenchGrpc.NumberBenchStub asyncStub = NumberBenchGrpc.newStub(channelHolder.channel())
				.withDeadlineAfter(DEFAULT_STUB_DEADLINE_SEC, TimeUnit.SECONDS);

		asyncStub.generateNumbersStream(
				GenerateNumbersStreamRequest.newBuilder().setCount(count).build(),
				new StreamObserver<>() {
					@Override
					public void onNext(NumberChunk chunk) {
						try {
							if (emitDelayMs > 0) {
								Thread.sleep(emitDelayMs);
							}
							String json = objectMapper.writeValueAsString(
									new StreamChunkDto(chunk.getIndex(), chunk.getSquare(), chunk.getSerializedSize()));
							emitter.send(org.springframework.web.servlet.mvc.method.annotation.SseEmitter.event()
									.name("chunk")
									.id(Integer.toString(chunk.getIndex()))
									.data(json));
						}
						catch (InterruptedException ie) {
							Thread.currentThread().interrupt();
							emitter.completeWithError(ie);
						}
						catch (Exception ex) {
							emitter.completeWithError(ex);
						}
					}

					@Override
					public void onError(Throwable t) {
						try {
							emitter.send(org.springframework.web.servlet.mvc.method.annotation.SseEmitter.event()
									.name("fail")
									.data(t.getMessage() != null ? t.getMessage() : t.toString()));
						}
						catch (Exception ignore) {
							// fall through
						}
						emitter.completeWithError(t);
					}

					@Override
					public void onCompleted() {
						try {
							emitter.send(org.springframework.web.servlet.mvc.method.annotation.SseEmitter.event()
									.name("complete")
									.data("\"ok\""));
						}
						catch (Exception ignore) {
							// fall through
						}
						emitter.complete();
					}
				});

		return emitter;
	}

	private static ResponseStatusException translate(StatusRuntimeException e) {
		String reason = e.getStatus().getDescription();
		if (reason == null) {
			reason = e.getMessage();
		}
		return switch (e.getStatus().getCode()) {
			case INVALID_ARGUMENT -> new ResponseStatusException(HttpStatus.BAD_REQUEST, reason, e);
			default -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, reason, e);
		};
	}

	@ExceptionHandler(ResponseStatusException.class)
	public ResponseEntity<String> badRequest(ResponseStatusException ex) {
		return ResponseEntity.status(ex.getStatusCode()).body(ex.getReason());
	}

	public record GrpcUnaryDemoDto(
			int count,
			List<Long> squares,
			int protobufSerializedBytes,
			int grpcUnaryMessageOnWireBytesApprox,
			long serverProcessingNanos) {
	}

	private record StreamChunkDto(int index, long square, int protobufChunkBytes) {
	}

	public record SerializationCompareDto(
			String jsonSample,
			int jsonUtf8Bytes,
			String protobufChunkHex,
			int protobufChunkBytes,
			String note) {
	}

	private static String bytesToHex(byte[] raw) {
		StringBuilder sb = new StringBuilder(raw.length * 3);
		for (int i = 0; i < raw.length; i++) {
			if (i > 0) {
				sb.append(' ');
			}
			sb.append(String.format("%02X", raw[i]));
		}
		return sb.toString();
	}
}
