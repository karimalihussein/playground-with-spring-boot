package com.playground.bench.core;

/**
 * Pure domain logic used by both REST (JSON) and gRPC (Protobuf) so benchmarks compare transports,
 * not different algorithms.
 * <p>
 * Design: no Spring annotations here — tiny "core" module pattern for clarity.
 */
public final class NumberGenerationCore {

	private NumberGenerationCore() {
	}

	/**
	 * @param count how many squares to emit (for i from 0..count-1, value is (i+1)^2)
	 * @return new array of length {@code count}
	 */
	public static long[] squares(int count) {
		long[] out = new long[count];
		for (int i = 0; i < count; i++) {
			long n = i + 1L;
			out[i] = n * n;
		}
		return out;
	}
}
