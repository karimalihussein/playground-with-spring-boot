package com.playground.bench.client;

import com.playground.bench.rpc.proto.ChatMessage;
import com.playground.bench.rpc.proto.GenerateNumbersStreamRequest;
import com.playground.bench.rpc.proto.NumberBenchGrpc;
import com.playground.bench.rpc.proto.NumberChunk;
import com.playground.bench.rpc.proto.UploadSummary;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.stub.StreamObserver;
import java.util.Locale;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Loads the three streaming RPC shapes. This is still a <strong>classroom</strong> harness — for serious
 * gRPC benchmarks, prefer <a href="https://ghz.sh/">ghz</a> or vendor tooling.
 * <p>
 * Modes:
 * <ul>
 *   <li>{@code server} — many parallel server-streaming RPCs (each reads {@code count} chunks).</li>
 *   <li>{@code client} — one client-streaming RPC that sends {@code count} chunks.</li>
 *   <li>{@code bidi} — one bidirectional stream with {@code count} client messages (each gets an echo).</li>
 * </ul>
 */
public final class GrpcStreamingBenchClient {

	public static void main(String[] args) throws Exception {
		Args a = Args.parse(args);
		ManagedChannel channel = ManagedChannelBuilder.forAddress(a.host, a.port).usePlaintext().build();
		try {
			switch (a.mode) {
				case SERVER -> runServerStreams(a, channel);
				case CLIENT -> runClientStream(a, channel);
				case BIDI -> runBidi(a, channel);
			}
		}
		finally {
			channel.shutdownNow();
			channel.awaitTermination(5, TimeUnit.SECONDS);
		}
	}

	/**
	 * Many concurrent server-streaming calls — stresses HTTP/2 multiplexing (many streams, one channel).
	 */
	private static void runServerStreams(Args a, ManagedChannel channel) throws InterruptedException {
		NumberBenchGrpc.NumberBenchBlockingStub stub = NumberBenchGrpc.newBlockingStub(channel);
		ExecutorService pool = Executors.newFixedThreadPool(a.concurrency);
		CountDownLatch done = new CountDownLatch(a.streams);
		long wallStart = System.nanoTime();
		AtomicLong totalChunks = new AtomicLong();

		for (int i = 0; i < a.streams; i++) {
			pool.submit(() -> {
				try {
					long local = 0;
					var request = GenerateNumbersStreamRequest.newBuilder().setCount(a.count).build();
					var iterator = stub.generateNumbersStream(request);
					while (iterator.hasNext()) {
						iterator.next();
						local++;
					}
					totalChunks.addAndGet(local);
				}
				finally {
					done.countDown();
				}
			});
		}
		done.await();
		pool.shutdownNow();
		long wallNs = System.nanoTime() - wallStart;
		double seconds = wallNs / 1_000_000_000.0;
		long chunks = totalChunks.get();
		System.out.println("Mode: gRPC server streaming (parallel RPCs)");
		System.out.println("Parallel streams (-s): " + a.streams);
		System.out.println("Chunks per stream (-k): " + a.count);
		System.out.printf(Locale.US, "Wall time:              %.3f s%n", seconds);
		System.out.printf(Locale.US, "Chunk throughput:       %.0f chunks/s (all streams combined)%n",
				chunks / Math.max(1e-9, seconds));
	}

	private static void runClientStream(Args a, ManagedChannel channel) throws Exception {
		NumberBenchGrpc.NumberBenchStub async = NumberBenchGrpc.newStub(channel);
		CountDownLatch done = new CountDownLatch(1);
		AtomicReference<UploadSummary> summaryBox = new AtomicReference<>();
		AtomicBoolean failed = new AtomicBoolean();

		StreamObserver<UploadSummary> responses = new StreamObserver<>() {
			@Override
			public void onNext(UploadSummary summary) {
				summaryBox.set(summary);
			}

			@Override
			public void onError(Throwable t) {
				failed.set(true);
				System.err.println("client streaming failed: " + t);
				done.countDown();
			}

			@Override
			public void onCompleted() {
				done.countDown();
			}
		};

		long wallStart = System.nanoTime();
		StreamObserver<NumberChunk> requestObserver = async.uploadNumbers(responses);
		for (int i = 0; i < a.count; i++) {
			int index = i + 1;
			long square = (long) index * index;
			requestObserver.onNext(NumberChunk.newBuilder().setIndex(index).setSquare(square).build());
		}
		requestObserver.onCompleted();
		if (!done.await(2, TimeUnit.MINUTES)) {
			throw new IllegalStateException("timeout waiting for UploadSummary");
		}
		long wallNs = System.nanoTime() - wallStart;
		if (failed.get()) {
			throw new IllegalStateException("client streaming failed");
		}
		UploadSummary summary = summaryBox.get();
		double seconds = wallNs / 1_000_000_000.0;
		System.out.println("Mode: gRPC client streaming (single RPC, many request messages)");
		System.out.println("Uploaded chunks (-k): " + a.count);
		System.out.printf(Locale.US, "Wall time:              %.3f s%n", seconds);
		System.out.printf(Locale.US, "Upload throughput:      %.0f chunks/s%n", a.count / Math.max(1e-9, seconds));
		if (summary != null) {
			System.out.println("Server saw count=" + summary.getReceivedCount() + " sumSquares=" + summary.getSumSquares());
		}
	}

	private static void runBidi(Args a, ManagedChannel channel) throws Exception {
		NumberBenchGrpc.NumberBenchStub async = NumberBenchGrpc.newStub(channel);
		CountDownLatch done = new CountDownLatch(1);
		AtomicInteger replies = new AtomicInteger();
		AtomicBoolean failed = new AtomicBoolean();

		StreamObserver<ChatMessage> responses = new StreamObserver<>() {
			@Override
			public void onNext(ChatMessage value) {
				replies.incrementAndGet();
			}

			@Override
			public void onError(Throwable t) {
				failed.set(true);
				System.err.println("bidi failed: " + t);
				done.countDown();
			}

			@Override
			public void onCompleted() {
				done.countDown();
			}
		};

		long wallStart = System.nanoTime();
		StreamObserver<ChatMessage> requests = async.chatStream(responses);
		for (int i = 0; i < a.count; i++) {
			requests.onNext(ChatMessage.newBuilder()
					.setClientId("bench")
					.setText("msg-" + i)
					.setSeq(i)
					.build());
		}
		requests.onCompleted();
		if (!done.await(2, TimeUnit.MINUTES)) {
			throw new IllegalStateException("timeout waiting for bidi stream to close");
		}
		long wallNs = System.nanoTime() - wallStart;
		if (failed.get()) {
			throw new IllegalStateException("bidi failed");
		}
		double seconds = wallNs / 1_000_000_000.0;
		System.out.println("Mode: gRPC bidirectional streaming (chat-style echo)");
		System.out.println("Client messages (-k): " + a.count);
		System.out.println("Server replies seen:  " + replies.get());
		System.out.printf(Locale.US, "Wall time:            %.3f s%n", seconds);
		System.out.printf(Locale.US, "Round-trip msgs/s:    %.0f%n", a.count / Math.max(1e-9, seconds));
	}

	private enum Mode {
		SERVER,
		CLIENT,
		BIDI
	}

	private record Args(Mode mode, String host, int port, int count, int concurrency, int streams) {

		static Args parse(String[] args) {
			Mode mode = Mode.SERVER;
			String host = "localhost";
			int port = 9090;
			int count = 10_000;
			int concurrency = 8;
			int streams = 8;
			for (int i = 0; i < args.length; i++) {
				switch (args[i]) {
					case "-m" -> mode = Mode.valueOf(args[++i].toUpperCase(Locale.ROOT));
					case "-h" -> host = args[++i];
					case "-p" -> port = Integer.parseInt(args[++i]);
					case "-k" -> count = Integer.parseInt(args[++i]);
					case "-c" -> concurrency = Integer.parseInt(args[++i]);
					case "-s" -> streams = Integer.parseInt(args[++i]);
					default -> throw new IllegalArgumentException(
							"Unknown arg: " + args[i] + " — use: -m server|client|bidi -h host -p port "
									+ "-k count/chunks -c threadPoolSize -s parallelServerStreams");
				}
			}
			if (count < 1 || concurrency < 1 || streams < 1) {
				throw new IllegalArgumentException("-k, -c, -s must be >= 1");
			}
			return new Args(mode, host, port, count, concurrency, streams);
		}
	}

	private GrpcStreamingBenchClient() {
	}
}
