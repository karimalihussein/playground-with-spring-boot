package com.playground.bench.service;

import com.playground.bench.core.NumberGenerationCore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Spring-facing service: validates input once, then calls the shared core used by REST + gRPC.
 */
@Service
public class NumberBenchService {

	/** Upper bound prevents accidental OOM when someone passes a huge {count} during class demos. */
	private final int maxCount;

	public NumberBenchService(@Value("${bench.max-count:500000}") int maxCount) {
		this.maxCount = maxCount;
	}

	public int normalizeAndValidate(int count) {
		if (count < 1 || count > maxCount) {
			throw new IllegalArgumentException(
					"count must be between 1 and " + maxCount + ", got " + count);
		}
		return count;
	}

	public long[] generateSquares(int count) {
		int n = normalizeAndValidate(count);
		return NumberGenerationCore.squares(n);
	}
}
