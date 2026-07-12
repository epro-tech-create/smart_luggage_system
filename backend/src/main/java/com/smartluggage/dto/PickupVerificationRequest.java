package com.smartluggage.dto;

import jakarta.validation.constraints.NotBlank;

public record PickupVerificationRequest(
        @NotBlank String pickupPin,
        @NotBlank String receiverPhone
) {
}
