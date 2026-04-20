package com.playground.exception;

public class InvalidTaxRateException extends RuntimeException {

	public InvalidTaxRateException(String message) {
		super(message);
	}
}
