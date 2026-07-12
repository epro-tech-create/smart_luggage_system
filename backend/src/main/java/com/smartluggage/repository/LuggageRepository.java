package com.smartluggage.repository;

import com.smartluggage.model.Luggage;
import com.smartluggage.model.LuggageStatus;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LuggageRepository extends JpaRepository<Luggage, Long> {
    Optional<Luggage> findByTrackingCodeIgnoreCase(String trackingCode);

    Optional<Luggage> findByRfidTagIgnoreCase(String rfidTag);

    long countByStatus(LuggageStatus status);
}
