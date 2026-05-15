package com.playground.bench.rest;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * JSON shape returned by {@code GET /rest/unary/{count}}.
 * <p>
 * {@link JsonProperty} on {@code squares} makes field name explicit for readers new to Jackson.
 */
public record NumbersJsonResponse(
		@JsonProperty("count") int count,
		@JsonProperty("squares") long[] squares) {
}
