package com.playground.exception;

import com.playground.controller.PaymentController;
import com.playground.dto.PaymentRequest;
import java.util.stream.Collectors;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.ui.Model;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

/**
 * Server-side rendered payment flow: returns Thymeleaf views with friendly messages.
 * Scoped to {@link PaymentController} so REST JSON handling stays in {@link GlobalExceptionHandler}.
 */
@ControllerAdvice(assignableTypes = PaymentController.class)
@Order(Ordered.HIGHEST_PRECEDENCE)
public class PaymentMvcExceptionHandler {

	@ExceptionHandler(BindException.class)
	public String handleBindException(BindException ex, Model model) {
		if (ex.getTarget() instanceof PaymentRequest paymentRequest) {
			model.addAttribute("paymentRequest", paymentRequest);
		}
		model.addAttribute(BindingResult.MODEL_KEY_PREFIX + "paymentRequest", ex);
		model.addAttribute("hasResult", false);
		model.addAttribute(
				"error",
				ex.getFieldErrors().stream()
						.map(err -> err.getField() + ": " + err.getDefaultMessage())
						.collect(Collectors.joining("; ")));
		return "payment";
	}

	@ExceptionHandler(PaymentFormException.class)
	public String handlePaymentFormException(PaymentFormException ex, Model model) {
		model.addAttribute("paymentRequest", ex.getPaymentRequest());
		model.addAttribute("hasResult", false);
		model.addAttribute("error", ex.getMessage());
		return "payment";
	}

	@ExceptionHandler(NumberFormatException.class)
	public String handleNumberFormat(NumberFormatException ex, Model model) {
		model.addAttribute("hasResult", false);
		model.addAttribute("error", "Enter valid numbers for amount and tax rate.");
		model.addAttribute("paymentRequest", emptyPaymentRequest());
		return "payment";
	}

	private static PaymentRequest emptyPaymentRequest() {
		PaymentRequest r = new PaymentRequest();
		r.setAmount("");
		r.setTaxRate("");
		return r;
	}
}
