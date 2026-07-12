package com.smartluggage.dto;

import com.smartluggage.model.LuggageStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record LuggageResponse(
        Long id,
        String trackingCode,
        String qrCode,
        String pickupPin,
        String senderName,
        String senderPhone,
        String receiverName,
        String receiverPhone,
        String originTerminal,
        String destinationTerminal,
        String currentTerminal,
        double weightKg,
        BigDecimal cost,
        String busNumber,
        String rfidTag,
        String ownerEmail,
        LuggageStatus status,
        Instant createdAt,
        Instant updatedAt,
        List<TrackingEventResponse> timeline
) {
}
