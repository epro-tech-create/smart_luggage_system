package com.smartluggage.service;

import com.smartluggage.dto.DashboardStats;
import com.smartluggage.dto.LuggageResponse;
import com.smartluggage.dto.MoveLuggageRequest;
import com.smartluggage.dto.PaymentRequest;
import com.smartluggage.dto.PickupVerificationRequest;
import com.smartluggage.dto.RegisterLuggageRequest;
import com.smartluggage.model.EventType;
import com.smartluggage.model.Luggage;
import com.smartluggage.model.LuggageStatus;
import com.smartluggage.model.Payment;
import com.smartluggage.model.PaymentStatus;
import com.smartluggage.model.TrackingEvent;
import com.smartluggage.repository.LuggageRepository;
import com.smartluggage.repository.PaymentRepository;
import com.smartluggage.repository.TrackingEventRepository;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Random;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LuggageService {
    private final LuggageRepository luggageRepository;
    private final PaymentRepository paymentRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final NotificationService notificationService;
    private final LuggageMapper luggageMapper;
    private final BigDecimal baseFee;
    private final BigDecimal ratePerKg;
    private final Random random = new Random();

    public LuggageService(
            LuggageRepository luggageRepository,
            PaymentRepository paymentRepository,
            TrackingEventRepository trackingEventRepository,
            NotificationService notificationService,
            LuggageMapper luggageMapper,
            @Value("${app.pricing.base-fee}") BigDecimal baseFee,
            @Value("${app.pricing.rate-per-kg}") BigDecimal ratePerKg) {
        this.luggageRepository = luggageRepository;
        this.paymentRepository = paymentRepository;
        this.trackingEventRepository = trackingEventRepository;
        this.notificationService = notificationService;
        this.luggageMapper = luggageMapper;
        this.baseFee = baseFee;
        this.ratePerKg = ratePerKg;
    }

    @Transactional
    public LuggageResponse register(RegisterLuggageRequest request) {
        return register(request, null, null);
    }

    @Transactional
    public LuggageResponse register(RegisterLuggageRequest request, String ownerEmail, String busCompany) {
        Luggage luggage = new Luggage();
        luggage.setTrackingCode("SLT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
        luggage.setQrCode("QR-" + UUID.randomUUID());
        luggage.setPickupPin(String.valueOf(1000 + random.nextInt(9000)));
        luggage.setSenderName(request.senderName());
        luggage.setSenderPhone(request.senderPhone());
        luggage.setReceiverName(request.receiverName());
        luggage.setReceiverPhone(request.receiverPhone());
        luggage.setOriginTerminal(request.originTerminal());
        luggage.setDestinationTerminal(request.destinationTerminal());
        luggage.setCurrentTerminal(request.originTerminal());
        luggage.setWeightKg(request.weightKg());
        luggage.setCost(baseFee.add(ratePerKg.multiply(BigDecimal.valueOf(request.weightKg()))));
        luggage.setBusNumber(request.busNumber());
        luggage.setRfidTag("RFID-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase(Locale.ROOT));
        luggage.setOwnerEmail(ownerEmail);
        luggage.setBusCompany(busCompany);

        Luggage saved = luggageRepository.save(luggage);
        addEvent(saved, EventType.REGISTERED, saved.getOriginTerminal(),
                "Luggage registered, weighed, and linked to QR/RFID identity.");
        notificationService.sendSms(saved, saved.getSenderPhone(),
                "Your luggage " + saved.getTrackingCode() + " is registered. Pay TZS " + saved.getCost() + ".");
        return luggageMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<LuggageResponse> list() {
        return luggageRepository.findAll().stream().map(luggageMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<LuggageResponse> listForOwner(String ownerEmail) {
        return luggageRepository.findByOwnerEmailIgnoreCase(ownerEmail).stream().map(luggageMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<LuggageResponse> listForCompany(String busCompany) {
        return luggageRepository.findByBusCompanyIgnoreCase(busCompany).stream().map(luggageMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<LuggageResponse> listForTerminal(String busCompany, String terminal) {
        return luggageRepository.findByBusCompanyIgnoreCaseAndCurrentTerminalIgnoreCase(busCompany, terminal)
                .stream().map(luggageMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public LuggageResponse findByTrackingCode(String trackingCode) {
        return luggageMapper.toResponse(getByTrackingCode(trackingCode));
    }

    @Transactional(readOnly = true)
    public LuggageResponse findByTrackingCodeOrRfid(String code) {
        return luggageRepository.findByTrackingCodeIgnoreCase(code)
                .or(() -> luggageRepository.findByRfidTagIgnoreCase(code))
                .map(luggageMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Luggage not found: " + code));
    }

    @Transactional
    public LuggageResponse confirmPayment(String trackingCode, PaymentRequest request) {
        Luggage luggage = getByTrackingCode(trackingCode);
        Payment payment = new Payment();
        payment.setLuggage(luggage);
        payment.setAmount(luggage.getCost());
        payment.setProvider(request.provider());
        payment.setPhoneNumber(request.phoneNumber());
        payment.setPayerPhone(request.phoneNumber());
        payment.setPaymentMethod("MOBILE_MONEY");
        payment.setPaymentStatus("SUCCESS");
        payment.setTransactionReference(request.transactionReference() == null
                ? "TX-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase(Locale.ROOT)
                : request.transactionReference());
        payment.setStatus(PaymentStatus.CONFIRMED);
        payment.setPaidAt(Instant.now());
        paymentRepository.save(payment);

        luggage.setStatus(LuggageStatus.PAID);
        luggage.touch();
        addEvent(luggage, EventType.PAID, luggage.getCurrentTerminal(),
                "Mobile money payment confirmed via " + payment.getProvider() + ".");
        notificationService.sendSms(luggage, luggage.getSenderPhone(),
                "Payment confirmed for " + luggage.getTrackingCode() + ". Keep your pickup PIN safe.");
        return luggageMapper.toResponse(luggageRepository.save(luggage));
    }

    @Transactional
    public LuggageResponse dispatch(String trackingCode) {
        Luggage luggage = getByTrackingCode(trackingCode);
        if (luggage.getStatus() != LuggageStatus.PAID) {
            throw new IllegalArgumentException("Only paid luggage can be dispatched.");
        }
        luggage.setStatus(LuggageStatus.IN_TRANSIT);
        luggage.touch();
        addEvent(luggage, EventType.DEPARTED, luggage.getCurrentTerminal(),
                "Bus departed from " + luggage.getCurrentTerminal() + ".");
        notificationService.sendSms(luggage, luggage.getReceiverPhone(),
                "Luggage " + luggage.getTrackingCode() + " is now in transit to " + luggage.getDestinationTerminal() + ".");
        return luggageMapper.toResponse(luggageRepository.save(luggage));
    }

    @Transactional
    public LuggageResponse scanStop(String trackingCode, MoveLuggageRequest request) {
        Luggage luggage = getByTrackingCode(trackingCode);
        if (luggage.getStatus() != LuggageStatus.IN_TRANSIT) {
            throw new IllegalArgumentException("Only luggage in transit can be processed on arrival.");
        }
        luggage.setCurrentTerminal(request.terminal());
        boolean arrived = request.terminal().equalsIgnoreCase(luggage.getDestinationTerminal());
        if (arrived) {
            luggage.setStatus(LuggageStatus.ARRIVED);
            addEvent(luggage, EventType.ARRIVED_AT_TERMINAL, request.terminal(),
                    "Luggage arrived at the correct destination. Pickup verification is required.");
            notificationService.sendSms(luggage, luggage.getReceiverPhone(),
                    "Your luggage " + luggage.getTrackingCode() + " has arrived. Pickup PIN: " + luggage.getPickupPin());
        } else {
            luggage.setStatus(LuggageStatus.WRONG_DESTINATION_ALERT);
            addEvent(luggage, EventType.WRONG_DESTINATION, request.terminal(),
                    "Geofence mismatch: scanned away from planned destination. Buzzer alert triggered.");
            notificationService.sendSms(luggage, luggage.getSenderPhone(),
                    "Alert: " + luggage.getTrackingCode() + " was scanned at " + request.terminal() + ".");
        }
        luggage.touch();
        return luggageMapper.toResponse(luggageRepository.save(luggage));
    }

    @Transactional
    public LuggageResponse verifyPickup(String trackingCode, PickupVerificationRequest request) {
        Luggage luggage = getByTrackingCode(trackingCode);
        if (luggage.getStatus() != LuggageStatus.ARRIVED) {
            throw new IllegalArgumentException("Luggage is not ready for pickup.");
        }
        boolean validPin = luggage.getPickupPin().equals(request.pickupPin());
        boolean validPhone = luggage.getReceiverPhone().equals(request.receiverPhone());
        if (!validPin || !validPhone) {
            throw new IllegalArgumentException("Pickup verification failed. Check receiver phone and pickup PIN.");
        }
        luggage.setStatus(LuggageStatus.VERIFIED_PICKUP);
        luggage.touch();
        addEvent(luggage, EventType.PICKED_UP, luggage.getCurrentTerminal(),
                "Receiver identity verified and luggage released.");
        notificationService.sendSms(luggage, luggage.getSenderPhone(),
                "Pickup completed for " + luggage.getTrackingCode() + ".");
        return luggageMapper.toResponse(luggageRepository.save(luggage));
    }

    @Transactional(readOnly = true)
    public DashboardStats dashboardStats() {
        BigDecimal revenue = paymentRepository.confirmedRevenue();
        return new DashboardStats(
                luggageRepository.count(),
                luggageRepository.countByStatus(LuggageStatus.IN_TRANSIT),
                luggageRepository.countByStatus(LuggageStatus.ARRIVED),
                luggageRepository.countByStatus(LuggageStatus.WRONG_DESTINATION_ALERT),
                luggageRepository.countByStatus(LuggageStatus.VERIFIED_PICKUP),
                paymentRepository.countByStatus(PaymentStatus.CONFIRMED),
                revenue == null ? BigDecimal.ZERO : revenue);
    }

    @Transactional(readOnly = true)
    public DashboardStats dashboardStatsFor(List<LuggageResponse> luggage) {
        return new DashboardStats(
                luggage.size(),
                luggage.stream().filter(item -> item.status() == LuggageStatus.IN_TRANSIT).count(),
                luggage.stream().filter(item -> item.status() == LuggageStatus.ARRIVED).count(),
                luggage.stream().filter(item -> item.status() == LuggageStatus.WRONG_DESTINATION_ALERT).count(),
                luggage.stream().filter(item -> item.status() == LuggageStatus.VERIFIED_PICKUP).count(),
                0,
                BigDecimal.ZERO);
    }

    private Luggage getByTrackingCode(String trackingCode) {
        return luggageRepository.findByTrackingCodeIgnoreCase(trackingCode)
                .orElseThrow(() -> new EntityNotFoundException("Luggage not found: " + trackingCode));
    }

    private void addEvent(Luggage luggage, EventType eventType, String terminal, String message) {
        TrackingEvent event = new TrackingEvent();
        event.setLuggage(luggage);
        event.setEventType(eventType);
        event.setTerminal(terminal);
        event.setMessage(message);
        trackingEventRepository.save(event);
    }
}
