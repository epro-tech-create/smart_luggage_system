package com.smartluggage.dto;

import java.math.BigDecimal;

public record DashboardStats(
        long totalLuggage,
        long inTransit,
        long arrived,
        long alerts,
        long verifiedPickups,
        long paidPayments,
        BigDecimal revenue
) {
}
