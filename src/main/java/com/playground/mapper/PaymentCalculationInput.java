package com.playground.mapper;

import java.math.BigDecimal;

/**
 * Parsed, validated inputs for {@link com.playground.service.PaymentService}.
 */
public record PaymentCalculationInput(BigDecimal amount, BigDecimal taxRate) {
}
