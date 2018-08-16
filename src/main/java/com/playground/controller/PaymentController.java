package com.playground.controller;

import com.playground.dto.PaymentRequest;
import com.playground.exception.InvalidPaymentAmountException;
import com.playground.exception.InvalidTaxRateException;
import com.playground.exception.PaymentFormException;
import com.playground.mapper.PaymentCalculationInput;
import com.playground.mapper.PaymentMapper;
import com.playground.service.PaymentResult;
import com.playground.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
public class PaymentController {

	private final PaymentMapper paymentMapper;
	private final PaymentService paymentService;

	public PaymentController(PaymentMapper paymentMapper, PaymentService paymentService) {
		this.paymentMapper = paymentMapper;
		this.paymentService = paymentService;
	}

	@GetMapping("/payment")
	public String paymentGet(@ModelAttribute("paymentRequest") PaymentRequest paymentRequest, Model model) {
		applyFormDefaults(paymentRequest);
		model.addAttribute("hasResult", false);
		return "payment";
	}

	@PostMapping("/payment")
	public String paymentPost(@Valid @ModelAttribute("paymentRequest") PaymentRequest paymentRequest, Model model) {
		PaymentResult result = submitPayment(paymentRequest);
		model.addAttribute("paymentResult", result);
		model.addAttribute("hasResult", true);
		return "payment";
	}

	private PaymentResult submitPayment(PaymentRequest paymentRequest) {
		PaymentCalculationInput input = paymentMapper.mapToCalculation(paymentRequest);
		try {
			return paymentService.calculatePaymentResult(input.amount(), input.taxRate());
		} catch (InvalidPaymentAmountException | InvalidTaxRateException ex) {
			throw new PaymentFormException(ex.getMessage(), paymentRequest, ex);
		}
	}

	private static void applyFormDefaults(PaymentRequest paymentRequest) {
		if (paymentRequest.getAmount() == null || paymentRequest.getAmount().isBlank()) {
			paymentRequest.setAmount("");
		}
		if (paymentRequest.getTaxRate() == null || paymentRequest.getTaxRate().isBlank()) {
			paymentRequest.setTaxRate(PaymentService.DEFAULT_TAX_RATE.toPlainString());
		}
	}
}
