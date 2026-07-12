package com.smartluggage.repository;

import com.smartluggage.model.Luggage;
import com.smartluggage.model.TrackingEvent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrackingEventRepository extends JpaRepository<TrackingEvent, Long> {
    List<TrackingEvent> findByLuggageOrderByOccurredAtAsc(Luggage luggage);
}
