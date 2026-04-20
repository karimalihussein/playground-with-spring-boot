package com.playground.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(UserNotFoundException.class)
	public ResponseEntity<ErrorResponse> handleUserNotFound(UserNotFoundException ex) {
		return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
	}

	@ExceptionHandler(DuplicateEmailException.class)
	public ResponseEntity<ErrorResponse> handleDuplicateEmail(DuplicateEmailException ex) {
		return buildResponse(HttpStatus.CONFLICT, ex.getMessage());
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
		String message = ex.getBindingResult().getFieldErrors().stream()
				.map(err -> err.getField() + ": " + err.getDefaultMessage())
				.collect(Collectors.joining("; "));
		return buildResponse(HttpStatus.BAD_REQUEST, message);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
		return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
	}

	private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String message) {
		ErrorResponse body = ErrorResponse.builder()
				.message(message)
				.status(status.name())
				.timestamp(Instant.now())
				.build();
		return ResponseEntity.status(status).body(body);
	}

}
