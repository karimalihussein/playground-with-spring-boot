package com.playground.bench.grpc;

import com.playground.bench.metrics.BenchStreamTelemetry;
import com.playground.bench.rpc.proto.ChatMessage;
import com.playground.bench.rpc.proto.GenerateNumbersRequest;
import com.playground.bench.rpc.proto.GenerateNumbersResponse;
import com.playground.bench.rpc.proto.GenerateNumbersStreamRequest;
import com.playground.bench.rpc.proto.NumberBenchGrpc;
import com.playground.bench.rpc.proto.NumberChunk;
import com.playground.bench.rpc.proto.UploadSummary;
import com.playground.bench.service.NumberBenchService;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * All {@link NumberBenchGrpc} RPCs in one class: unary + three streaming patterns.
 * <p>
 * Internals (teaching mental model):
 * <ul>
 *   <li>Each RPC is an HTTP/2 <strong>stream</strong> (multiplexed on one connection; RFC 9113).</li>
 *   <li>Each Protobuf message is gRPC-framed (5-byte length prefix + message bytes).</li>
 *   <li>Streaming RPCs = many such messages on the <strong>same</strong> HTTP/2 stream until half-close/complete.</li>
 *   <li><strong>Backpressure</strong>: if you produce faster than the network/client reads, buffers fill;
 *       HTTP/2 flow control (“WINDOW_UPDATE”) eventually slows producers — see Netty/gRPC docs + RFC 9113.</li>
 * </ul>
 */
@Service
public class NumberBenchGrpcService extends NumberBenchGrpc.NumberBenchImplBase {

	private static final Logger log = LoggerFactory.getLogger(NumberBenchGrpcService.class);

	private final NumberBenchService numberBenchService;
	private final BenchStreamTelemetry telemetry;

	/** Optional pause between server-stream chunks to make “realtime” behavior visible (default 0). */
	private final int delayMsBetweenChunks;

	public NumberBenchGrpcService(
			NumberBenchService numberBenchService,
			BenchStreamTelemetry telemetry,
			@Value("${bench.stream.server-chunk-delay-ms:0}") int delayMsBetweenChunks) {
		this.numberBenchService = numberBenchService;
		this.telemetry = telemetry;
		this.delayMsBetweenChunks = delayMsBetweenChunks;
	}

	@Override
	public void generateNumbers(GenerateNumbersRequest request, StreamObserver<GenerateNumbersResponse> observer) {
		int count = request.getCount();
		final long t0 = System.nanoTime();
		final long[] squares;
		try {
			squares = numberBenchService.generateSquares(count);
		}
		catch (IllegalArgumentException ex) {
			observer.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
			return;
		}
		final long tAfterCompute = System.nanoTime();

		GenerateNumbersResponse.Builder builder = GenerateNumbersResponse.newBuilder().setCount(count);
		for (long v : squares) {
			builder.addSquares(v);
		}
		GenerateNumbersResponse response = builder.build();
		final long tAfterBuild = System.nanoTime();

		log.debug(
				"gRPC unary done: count={} protobufSerializedSize={} computeNs={} buildNs={}",
				count,
				response.getSerializedSize(),
				tAfterCompute - t0,
				tAfterBuild - tAfterCompute);

		observer.onNext(response);
		observer.onCompleted();
	}

	/**
	 * Server streaming: one {@link GenerateNumbersStreamRequest} in, many {@link NumberChunk} out.
	 * The client’s {@link io.grpc.stub.ClientCalls} read side will pull data; if it stops reading,
	 * backpressure propagates.
	 */
	@Override
	public void generateNumbersStream(
			GenerateNumbersStreamRequest request,
			StreamObserver<NumberChunk> responseObserver) {
		final String label = "GenerateNumbersStream";
		telemetry.grpcStreamOpened(label);
		try {
			int count = numberBenchService.normalizeAndValidate(request.getCount());
			int emitted = 0;
			for (int i = 0; i < count; i++) {
				int index = i + 1;
				long square = (long) index * index;
				NumberChunk chunk = NumberChunk.newBuilder().setIndex(index).setSquare(square).build();
				responseObserver.onNext(chunk);
				emitted++;
				if (emitted % 10_000 == 0) {
					log.debug("{} progress: emittedChunks={}", label, emitted);
				}
				if (delayMsBetweenChunks > 0) {
					Thread.sleep(delayMsBetweenChunks);
				}
			}
			log.info("{} finished: streamedChunks={}", label, emitted);
			responseObserver.onCompleted();
		}
		catch (IllegalArgumentException ex) {
			responseObserver.onError(Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException());
		}
		catch (InterruptedException ie) {
			Thread.currentThread().interrupt();
			responseObserver.onError(Status.CANCELLED.withDescription("interrupted").asRuntimeException());
		}
		catch (RuntimeException ex) {
			responseObserver.onError(Status.UNKNOWN.withDescription(ex.getMessage()).asRuntimeException());
		}
		finally {
			telemetry.grpcStreamClosed(label);
		}
	}

	/**
	 * Client streaming: many {@link NumberChunk} in, one {@link UploadSummary} out.
	 * The returned {@link StreamObserver} is how the server receives the client’s inbound stream.
	 */
	@Override
	public StreamObserver<NumberChunk> uploadNumbers(StreamObserver<UploadSummary> responseObserver) {
		final String label = "UploadNumbers";
		telemetry.grpcStreamOpened(label);
		return new StreamObserver<>() {
			private final AtomicInteger received = new AtomicInteger();
			private final AtomicBoolean ended = new AtomicBoolean();
			private long sumSquares;

			private void endOnce() {
				if (ended.compareAndSet(false, true)) {
					telemetry.grpcStreamClosed(label);
				}
			}

			@Override
			public void onNext(NumberChunk chunk) {
				received.incrementAndGet();
				sumSquares += chunk.getSquare();
			}

			@Override
			public void onError(Throwable t) {
				log.warn("{} server inbound error: {}", label, t.toString());
				endOnce();
				responseObserver.onError(t);
			}

			@Override
			public void onCompleted() {
				UploadSummary summary = UploadSummary.newBuilder()
						.setReceivedCount(received.get())
						.setSumSquares(sumSquares)
						.build();
				log.info("{} summary: receivedCount={} sumSquares={}", label, summary.getReceivedCount(), summary.getSumSquares());
				try {
					responseObserver.onNext(summary);
					responseObserver.onCompleted();
				}
				catch (RuntimeException ex) {
					log.warn("{} failed sending summary", label, ex);
					responseObserver.onError(ex);
				}
				finally {
					endOnce();
				}
			}
		};
	}

	/**
	 * Bidirectional streaming: read and write are decoupled — echo with a small server-side transform.
	 * This is the closest gRPC primitive to “two-way pipe” (still not WebSocket framing!).
	 */
	@Override
	public StreamObserver<ChatMessage> chatStream(StreamObserver<ChatMessage> responseObserver) {
		final String label = "ChatStream";
		telemetry.grpcStreamOpened(label);
		return new StreamObserver<>() {
			private final AtomicBoolean ended = new AtomicBoolean();

			private void endOnce() {
				if (ended.compareAndSet(false, true)) {
					telemetry.grpcStreamClosed(label);
				}
			}

			@Override
			public void onNext(ChatMessage message) {
				ChatMessage reply = ChatMessage.newBuilder()
						.setClientId("server")
						.setText("echo(" + message.getClientId() + "): " + message.getText())
						.setSeq(message.getSeq())
						.build();
				responseObserver.onNext(reply);
			}

			@Override
			public void onError(Throwable t) {
				log.warn("{} error: {}", label, t.toString());
				endOnce();
				responseObserver.onError(t);
			}

			@Override
			public void onCompleted() {
				log.info("{} client half-closed writer; completing server stream", label);
				try {
					responseObserver.onCompleted();
				}
				finally {
					endOnce();
				}
			}
		};
	}
}
