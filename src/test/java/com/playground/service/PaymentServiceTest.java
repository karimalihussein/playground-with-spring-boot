package com.playground.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.playground.exception.InvalidPaymentAmountException;
import com.playground.exception.InvalidTaxRateException;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("PaymentService")
class PaymentServiceTest {

	private PaymentService paymentService;

	@BeforeEach
	void setUp() {
		paymentService = new PaymentService();
	}

	@Nested
	@DisplayName("calculateTotal(double, double)")
	class CalculateTotalWithTaxRate {

		@Test
		@DisplayName("valid calculation applies tax and rounds to money scale")
		void validCalculation() {
			// given
			double amount = 100.0;
			double taxRate = 0.10;
			// when
			double total = paymentService.calculateTotal(amount, taxRate);
			// then
			assertEquals(110.0, total, 1e-9);
		}

		@Test
		@DisplayName("amount zero yields total zero")
		void zeroAmount() {
			// given
			double amount = 0.0;
			double taxRate = 0.14;
			// when
			double total = paymentService.calculateTotal(amount, taxRate);
			// then
			assertEquals(0.0, total, 1e-9);
		}

		@Test
		@DisplayName("tax rate zero yields total equal to amount")
		void zeroTaxRate() {
			// given
			double amount = 50.0;
			double taxRate = 0.0;
			// when
			double total = paymentService.calculateTotal(amount, taxRate);
			// then
			assertEquals(50.0, total, 1e-9);
		}

		@Test
		@DisplayName("negative amount throws InvalidPaymentAmountException")
		void negativeAmount() {
			// given
			double amount = -1.0;
			double taxRate = 0.1;
			// when / then
			assertThrows(InvalidPaymentAmountException.class, () -> paymentService.calculateTotal(amount, taxRate));
		}

		@Test
		@DisplayName("negative tax rate throws InvalidTaxRateException")
		void negativeTaxRate() {
			// given
			double amount = 10.0;
			double taxRate = -0.05;
			// when / then
			assertThrows(InvalidTaxRateException.class, () -> paymentService.calculateTotal(amount, taxRate));
		}
	}

	@Nested
	@DisplayName("calculateTotal(double) default tax")
	class CalculateTotalDefaultTax {

		@Test
		@DisplayName("uses DEFAULT_TAX_RATE (0.14)")
		void usesDefaultTax() {
			// given
			double amount = 100.0;
			// when
			double total = paymentService.calculateTotal(amount);
			// then
			assertEquals(114.0, total, 1e-9);
		}

		@Test
		@DisplayName("zero amount with default tax is zero")
		void zeroAmount() {
			// given
			double amount = 0.0;
			// when
			double total = paymentService.calculateTotal(amount);
			// then
			assertEquals(0.0, total, 1e-9);
		}

		@Test
		@DisplayName("negative amount throws")
		void negativeAmount() {
			// given
			double amount = -0.01;
			// when / then
			assertThrows(InvalidPaymentAmountException.class, () -> paymentService.calculateTotal(amount));
		}
	}

	@Nested
	@DisplayName("calculatePaymentResult (BigDecimal)")
	class CalculatePaymentResult {

		@Test
		@DisplayName("returns amount, tax, and total with consistent rounding")
		void validCalculation() {
			// given
			BigDecimal amount = new BigDecimal("100.00");
			BigDecimal taxRate = new BigDecimal("0.14");
			// when
			PaymentResult result = paymentService.calculatePaymentResult(amount, taxRate);
			// then
			assertEquals(0, new BigDecimal("100.00").compareTo(result.amount()));
			assertEquals(0, new BigDecimal("14.00").compareTo(result.tax()));
			assertEquals(0, new BigDecimal("114.00").compareTo(result.total()));
		}

		@Test
		@DisplayName("single-arg overload uses default tax rate")
		void defaultTaxOverload() {
			// given
			BigDecimal amount = new BigDecimal("200.00");
			// when
			PaymentResult result = paymentService.calculatePaymentResult(amount);
			// then
			assertEquals(0, new BigDecimal("28.00").compareTo(result.tax()));
			assertEquals(0, new BigDecimal("228.00").compareTo(result.total()));
		}

		@Test
		@DisplayName("zero amount and zero tax edge case")
		void zeroAmountAndZeroTax() {
			// given
			BigDecimal amount = BigDecimal.ZERO;
			BigDecimal taxRate = BigDecimal.ZERO;
			// when
			PaymentResult result = paymentService.calculatePaymentResult(amount, taxRate);
			// then
			assertEquals(0, BigDecimal.ZERO.setScale(2).compareTo(result.amount()));
			assertEquals(0, BigDecimal.ZERO.setScale(2).compareTo(result.tax()));
			assertEquals(0, BigDecimal.ZERO.setScale(2).compareTo(result.total()));
		}

		@Test
		@DisplayName("negative amount throws")
		void negativeAmount() {
			// given
			BigDecimal amount = new BigDecimal("-10");
			BigDecimal taxRate = new BigDecimal("0.1");
			// when / then
			assertThrows(InvalidPaymentAmountException.class, () -> paymentService.calculatePaymentResult(amount, taxRate));
		}

		@Test
		@DisplayName("negative tax throws")
		void negativeTax() {
			// given
			BigDecimal amount = new BigDecimal("10");
			BigDecimal taxRate = new BigDecimal("-0.01");
			// when / then
			assertThrows(InvalidTaxRateException.class, () -> paymentService.calculatePaymentResult(amount, taxRate));
		}
	}
}
