package com.playground.service;

import com.playground.exception.InvalidPaymentAmountException;
import com.playground.exception.InvalidTaxRateException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class PaymentService {

	/**
	 * Default VAT-style rate (14%). Kept as {@link BigDecimal} string literal so the value is exact;
	 * {@code 0.14} as {@code double} is not represented exactly in binary floating-point.
	 */
	public static final BigDecimal DEFAULT_TAX_RATE = new BigDecimal("0.14");

	private static final int MONEY_SCALE = 2;
	private static final RoundingMode MONEY_ROUNDING = RoundingMode.HALF_UP;

	public double calculateTotal(double amount, double taxRate) {
		PaymentResult result = calculatePaymentResult(BigDecimal.valueOf(amount), BigDecimal.valueOf(taxRate));
		return result.total().doubleValue();
	}

	public double calculateTotal(double amount) {
		PaymentResult result = calculatePaymentResult(BigDecimal.valueOf(amount), DEFAULT_TAX_RATE);
		return result.total().doubleValue();
	}

	/**
	 * Preferred API for money: uses {@link BigDecimal} end-to-end.
	 * <p>
	 * BigDecimal is preferable to {@code double} for money because binary floating-point cannot
	 * represent many decimal fractions exactly, which accumulates rounding error in chains of
	 * operations; BigDecimal performs base-10 arithmetic with user-controlled scale and rounding
	 * (see {@link BigDecimal} in the Java Platform SE API).
	 */
	public PaymentResult calculatePaymentResult(BigDecimal amount, BigDecimal taxRate) {
		Objects.requireNonNull(amount, "amount must not be null");
		Objects.requireNonNull(taxRate, "taxRate must not be null");
		validateAmount(amount);
		validateTaxRate(taxRate);

		log.info("Calculating payment total: amount={}, taxRate={}", amount, taxRate);

		BigDecimal tax = calculateTax(amount, taxRate);
		BigDecimal total = amount.add(tax).setScale(MONEY_SCALE, MONEY_ROUNDING);

		log.info("Payment total calculated: amount={}, tax={}, total={}", amount, tax, total);

		return new PaymentResult(
				amount.setScale(MONEY_SCALE, MONEY_ROUNDING),
				tax,
				total);
	}

	public PaymentResult calculatePaymentResult(BigDecimal amount) {
		return calculatePaymentResult(amount, DEFAULT_TAX_RATE);
	}

	private BigDecimal calculateTax(BigDecimal amount, BigDecimal taxRate) {
		return amount.multiply(taxRate).setScale(MONEY_SCALE, MONEY_ROUNDING);
	}

	private void validateAmount(BigDecimal amount) {
		if (amount.compareTo(BigDecimal.ZERO) < 0) {
			throw new InvalidPaymentAmountException("Amount must not be negative: " + amount);
		}
	}

	private void validateTaxRate(BigDecimal taxRate) {
		if (taxRate.compareTo(BigDecimal.ZERO) < 0) {
			throw new InvalidTaxRateException("Tax rate must not be negative: " + taxRate);
		}
	}
}
