package com.smartluggage.dto;

import com.smartluggage.model.UserRole;
import java.time.Instant;

public record AuthResponse(
        Long id,
        String fullName,
        String email,
        String phoneNumber,
        UserRole role,
        String busCompany,
        String assignedTerminal,
        String token,
        Instant lastLoginAt
) {
}
