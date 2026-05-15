package com.playground.exception;

import com.playground.dto.PaymentRequest;
import lombok.Getter;

/**
 * Wraps form-level failures so MVC can repopulate the payment form and show a friendly message.
 */
@Getter
public class PaymentFormException extends RuntimeException {

	private final PaymentRequest paymentRequest;

	public PaymentFormException(String message, PaymentRequest paymentRequest, Throwable cause) {
		super(message, cause);
		this.paymentRequest = paymentRequest;
	}

	public PaymentFormException(String message, PaymentRequest paymentRequest) {
		super(message);
		this.paymentRequest = paymentRequest;
	}
}
