package com.playground.exception;

public class DuplicateEmailException extends RuntimeException {

	public DuplicateEmailException(String message) {
		super(message);
	}

	public DuplicateEmailException(String email, String message) {
		super(message + ": " + email);
	}

}
