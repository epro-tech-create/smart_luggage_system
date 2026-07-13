package com.smartluggage.repository;

import com.smartluggage.model.Luggage;
import com.smartluggage.model.LuggageStatus;
import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LuggageRepository extends JpaRepository<Luggage, Long> {
    Optional<Luggage> findByTrackingCodeIgnoreCase(String trackingCode);

    Optional<Luggage> findByRfidTagIgnoreCase(String rfidTag);

    long countByStatus(LuggageStatus status);

    List<Luggage> findByOwnerEmailIgnoreCase(String ownerEmail);

    List<Luggage> findByBusCompanyIgnoreCase(String busCompany);

    List<Luggage> findByBusCompanyIgnoreCaseAndCurrentTerminalIgnoreCase(String busCompany, String currentTerminal);
}
