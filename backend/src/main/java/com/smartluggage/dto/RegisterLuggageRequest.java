package com.smartluggage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record RegisterLuggageRequest(
        @NotBlank String senderName,
        @NotBlank String senderPhone,
        @NotBlank String receiverName,
        @NotBlank String receiverPhone,
        @NotBlank String originTerminal,
        @NotBlank String destinationTerminal,
        @Positive double weightKg,
        String busNumber
) {
}
