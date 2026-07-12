package com.smartluggage.dto;

import jakarta.validation.constraints.NotBlank;

public record PaymentRequest(
        @NotBlank String provider,
        @NotBlank String phoneNumber,
        String transactionReference
) {
}
