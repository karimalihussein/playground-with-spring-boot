package com.playground.service;

import java.math.BigDecimal;

/**
 * Immutable snapshot of a payment calculation: base amount, computed tax, and total.
 * Uses {@link BigDecimal} for exact decimal arithmetic suitable for monetary values.
 */
public record PaymentResult(BigDecimal amount, BigDecimal tax, BigDecimal total) {
}
