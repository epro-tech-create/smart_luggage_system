package com.smartluggage.dto;

import jakarta.validation.constraints.NotBlank;

public record MoveLuggageRequest(
        @NotBlank String terminal,
        String note
) {
}
