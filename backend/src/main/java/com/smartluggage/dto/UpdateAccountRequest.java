package com.smartluggage.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateAccountRequest(
        @NotBlank String fullName,
        @Email @NotBlank String email,
        String phoneNumber,
        @Size(min = 6) String password
) {
}
