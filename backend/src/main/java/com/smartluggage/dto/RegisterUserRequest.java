package com.smartluggage.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterUserRequest(
        @NotBlank String fullName,
        @Email @NotBlank String email,
        String phoneNumber,
        @NotBlank @Size(min = 6) String password,
        String role
) {
}
