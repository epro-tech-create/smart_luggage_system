package com.smartluggage.dto;

import java.math.BigDecimal;

public record AdminOverview(
        long totalUsers,
        long totalLuggage,
        long paidPayments,
        BigDecimal revenue
) {
}
