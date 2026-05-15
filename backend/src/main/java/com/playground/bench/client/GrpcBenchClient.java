package com.playground.bench.client;

import com.playground.bench.rpc.proto.GenerateNumbersRequest;
import com.playground.bench.rpc.proto.NumberBenchGrpc;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.StatusRuntimeException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Minimal "ApacheBench-shaped" driver for unary gRPC: {@code -n} total calls, {@code -c} concurrent workers,
 * one shared {@link ManagedChannel} (so you exercise HTTP/2 multiplexing on a single TCP connection).
 * <p>
 * Why not {@code ab}? ApacheBench speaks HTTP/1.x, not gRPC's HTTP/2 framing + protobuf payloads.
 * For production-grade gRPC load tests, also evaluate <a href="https://ghz.sh/">ghz</a>.
 */
public final class GrpcBenchClient {

	public static void main(String[] args) throws Exception {
		Args a = Args.parse(args);
		ManagedChannel channel = ManagedChannelBuilder.forAddress(a.host, a.port).usePlaintext().build();
		try {
			run(a, channel);
		}
		finally {
			channel.shutdownNow();
			channel.awaitTermination(5, TimeUnit.SECONDS);
		}
	}

	private static void run(Args a, ManagedChannel channel) throws InterruptedException {
		List<Long> latenciesMs = Collections.synchronizedList(new ArrayList<>(a.requests));
		AtomicInteger ok = new AtomicInteger();
		AtomicInteger fail = new AtomicInteger();

		ExecutorService pool = Executors.newFixedThreadPool(a.concurrency);
		CountDownLatch done = new CountDownLatch(a.requests);
		long wallStart = System.nanoTime();

		for (int i = 0; i < a.requests; i++) {
			pool.submit(() -> {
				long t0 = System.nanoTime();
				try {
					// New stub per task: cheap, keeps the demo obvious/safe across gRPC versions.
					NumberBenchGrpc.NumberBenchBlockingStub stub = NumberBenchGrpc.newBlockingStub(channel);
					stub.generateNumbers(GenerateNumbersRequest.newBuilder().setCount(a.count).build());
					ok.incrementAndGet();
					latenciesMs.add((System.nanoTime() - t0) / 1_000_000L);
				}
				catch (StatusRuntimeException e) {
					fail.incrementAndGet();
				}
				finally {
					done.countDown();
				}
			});
		}

		done.await();
		pool.shutdownNow();
		long wallNs = System.nanoTime() - wallStart;

		List<Long> sorted = new ArrayList<>(latenciesMs);
		Collections.sort(sorted);

		double seconds = wallNs / 1_000_000_000.0;
		double rps = ok.get() / Math.max(1e-9, seconds);
		double meanMs = sorted.isEmpty() ? 0.0 : sorted.stream().mapToLong(Long::longValue).average().orElse(0.0);

		System.out.println("Benchmark: gRPC unary GenerateNumbers (education client, not ApacheBench)");
		System.out.println("Complete requests:      " + ok.get());
		System.out.println("Failed requests:        " + fail.get());
		System.out.println("Concurrency:            " + a.concurrency);
		System.out.printf(Locale.US, "Time taken for tests:   %.3f seconds%n", seconds);
		System.out.printf(Locale.US, "Requests per second:    %.2f [#/sec] (mean)%n", rps);
		System.out.printf(Locale.US, "Time per request:       %.3f [ms] (mean, across all concurrent requests)%n",
				meanMs);
		if (!sorted.isEmpty()) {
			System.out.printf(Locale.US, "Latency p50/p95/p99 ms: %d / %d / %d%n",
					percentile(sorted, 50), percentile(sorted, 95), percentile(sorted, 99));
		}
	}

	private static long percentile(List<Long> sorted, int p) {
		int idx = (int) Math.ceil(p / 100.0 * sorted.size()) - 1;
		idx = Math.max(0, Math.min(sorted.size() - 1, idx));
		return sorted.get(idx);
	}

	private record Args(String host, int port, int requests, int concurrency, int count) {

		static Args parse(String[] args) {
			String host = "localhost";
			int port = 9090;
			int n = 1000;
			int c = 50;
			int count = 1000;
			for (int i = 0; i < args.length; i++) {
				switch (args[i]) {
					case "-h" -> host = args[++i];
					case "-p" -> port = Integer.parseInt(args[++i]);
					case "-n" -> n = Integer.parseInt(args[++i]);
					case "-c" -> c = Integer.parseInt(args[++i]);
					case "-k" -> count = Integer.parseInt(args[++i]);
					default -> throw new IllegalArgumentException(
							"Unknown arg: " + args[i] + " — use: -h host -p port -n total -c concurrency -k count");
				}
			}
			if (n < 1 || c < 1 || count < 1) {
				throw new IllegalArgumentException("-n, -c, -k must be >= 1");
			}
			return new Args(host, port, n, c, count);
		}
	}

	private GrpcBenchClient() {
	}
}
