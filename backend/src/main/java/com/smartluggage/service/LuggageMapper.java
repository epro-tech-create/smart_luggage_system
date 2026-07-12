package com.smartluggage.service;

import com.smartluggage.dto.LuggageResponse;
import com.smartluggage.dto.TrackingEventResponse;
import com.smartluggage.model.Luggage;
import com.smartluggage.repository.TrackingEventRepository;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class LuggageMapper {
    private final TrackingEventRepository trackingEventRepository;

    public LuggageMapper(TrackingEventRepository trackingEventRepository) {
        this.trackingEventRepository = trackingEventRepository;
    }

    public LuggageResponse toResponse(Luggage luggage) {
        List<TrackingEventResponse> timeline = trackingEventRepository.findByLuggageOrderByOccurredAtAsc(luggage)
                .stream()
                .map(event -> new TrackingEventResponse(
                        event.getEventType(),
                        event.getTerminal(),
                        event.getMessage(),
                        event.getOccurredAt()))
                .toList();

        return new LuggageResponse(
                luggage.getId(),
                luggage.getTrackingCode(),
                luggage.getQrCode(),
                luggage.getPickupPin(),
                luggage.getSenderName(),
                luggage.getSenderPhone(),
                luggage.getReceiverName(),
                luggage.getReceiverPhone(),
                luggage.getOriginTerminal(),
                luggage.getDestinationTerminal(),
                luggage.getCurrentTerminal(),
                luggage.getWeightKg(),
                luggage.getCost(),
                luggage.getBusNumber(),
                luggage.getRfidTag(),
                luggage.getOwnerEmail(),
                luggage.getStatus(),
                luggage.getCreatedAt(),
                luggage.getUpdatedAt(),
                timeline);
    }
}
