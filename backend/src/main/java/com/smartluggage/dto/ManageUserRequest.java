package com.smartluggage.dto;

import com.smartluggage.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ManageUserRequest(
        @NotBlank String fullName,
        @Email @NotBlank String email,
        String phoneNumber,
        @NotNull UserRole role,
        String busCompany,
        String assignedTerminal,
        Boolean active,
        @Size(min = 6) String password
) {
}
