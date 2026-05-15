package com.playground.bench.rest;

import tools.jackson.databind.ObjectMapper;
import com.playground.bench.service.NumberBenchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * REST side of the benchmark: Spring MVC serializes {@link NumbersJsonResponse} to JSON bytes.
 * <p>
 * Typical stack: Tomcat (here: embedded servlet container) → Spring MVC → Jackson → HTTP response.
 * Default for many Spring apps is HTTP/1.1 with keep-alive; that affects connection reuse vs gRPC/HTTP/2.
 */
@RestController
public class UnaryNumbersRestController {

	private static final Logger log = LoggerFactory.getLogger(UnaryNumbersRestController.class);

	private final NumberBenchService numberBenchService;
	private final ObjectMapper objectMapper;

	public UnaryNumbersRestController(NumberBenchService numberBenchService, ObjectMapper objectMapper) {
		this.numberBenchService = numberBenchService;
		this.objectMapper = objectMapper;
	}

	/**
	 * {@code GET /rest/unary/{count}} mirrors the gRPC unary {@code GenerateNumbers}.
	 * <p>
	 * We serialize explicitly with Jackson to measure UTF-8 JSON bytes + serialization time — useful in class.
	 */
	@GetMapping(value = "/rest/unary/{count}", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<byte[]> unaryJson(@PathVariable("count") int count) {
		final long t0 = System.nanoTime();
		final long[] squares = numberBenchService.generateSquares(count);
		final NumbersJsonResponse dto = new NumbersJsonResponse(count, squares);
		final long tAfterDto = System.nanoTime();

		final byte[] jsonBytes;
		try {
			// writeValueAsBytes: Jackson converts the graph to JSON text, then UTF-8 bytes.
			jsonBytes = objectMapper.writeValueAsBytes(dto);
		}
		catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "json encoding failed", e);
		}
		final long t1 = System.nanoTime();

		// "Visual" logs: flip com.playground.bench to DEBUG to see per-request lines during a demo.
		log.debug(
				"REST unary done: count={} jsonBytes={} computeNs={} jacksonNs={}",
				count,
				jsonBytes.length,
				tAfterDto - t0,
				t1 - tAfterDto);

		return ResponseEntity.ok()
				.contentType(MediaType.APPLICATION_JSON)
				.contentLength(jsonBytes.length)
				.body(jsonBytes);
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<String> badCount(IllegalArgumentException ex) {
		return ResponseEntity.badRequest().body(ex.getMessage());
	}
}
