package com.playground.mapper;

import com.playground.dto.PaymentRequest;
import com.playground.exception.PaymentFormException;
import com.playground.service.PaymentService;
import java.math.BigDecimal;
import org.springframework.stereotype.Component;

@Component
public class PaymentMapper {

	/**
	 * Converts form strings to decimals and applies default tax when the field is blank.
	 */
	public PaymentCalculationInput mapToCalculation(PaymentRequest request) {
		String amountRaw = request.getAmount() != null ? request.getAmount().trim() : "";
		String taxRaw = request.getTaxRate() != null ? request.getTaxRate().trim() : "";
		if (taxRaw.isEmpty()) {
			taxRaw = PaymentService.DEFAULT_TAX_RATE.toPlainString();
		}
		try {
			BigDecimal amount = new BigDecimal(amountRaw);
			BigDecimal taxRate = new BigDecimal(taxRaw);
			return new PaymentCalculationInput(amount, taxRate);
		} catch (NumberFormatException ex) {
			throw new PaymentFormException("Enter valid numbers for amount and tax rate.", request, ex);
		}
	}
}
