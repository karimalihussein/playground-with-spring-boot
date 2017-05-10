package com.playground.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PaymentRequest {

	@NotBlank(message = "Amount is required.")
	private String amount;

	/**
	 * Optional; when blank, {@link com.playground.mapper.PaymentMapper} applies default tax rate.
	 */
	private String taxRate;
}
