package com.smartluggage.dto;

import com.smartluggage.model.LuggageStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record UpdateLuggageRequest(
        @NotBlank String senderName,
        @NotBlank String senderPhone,
        @NotBlank String receiverName,
        @NotBlank String receiverPhone,
        @NotBlank String originTerminal,
        @NotBlank String destinationTerminal,
        String currentTerminal,
        @Positive double weightKg,
        String busNumber,
        String ownerEmail,
        String busCompany,
        LuggageStatus status
) {
}
