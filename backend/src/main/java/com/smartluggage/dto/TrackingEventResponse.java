package com.smartluggage.dto;

import com.smartluggage.model.EventType;
import java.time.Instant;

public record TrackingEventResponse(
        EventType eventType,
        String terminal,
        String message,
        Instant occurredAt
) {
}
