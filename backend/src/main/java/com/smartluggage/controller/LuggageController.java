package com.smartluggage.controller;

import com.smartluggage.dto.DashboardStats;
import com.smartluggage.dto.LuggageResponse;
import com.smartluggage.dto.MoveLuggageRequest;
import com.smartluggage.dto.PaymentRequest;
import com.smartluggage.dto.PickupVerificationRequest;
import com.smartluggage.dto.RegisterLuggageRequest;
import com.smartluggage.service.LuggageService;
import com.smartluggage.service.AuthService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class LuggageController {
    private final LuggageService luggageService;
    private final AuthService authService;

    public LuggageController(LuggageService luggageService, AuthService authService) {
        this.luggageService = luggageService;
        this.authService = authService;
    }

    @GetMapping("/dashboard")
    public DashboardStats dashboardStats() {
        return luggageService.dashboardStats();
    }

    @GetMapping("/luggage")
    public List<LuggageResponse> list() {
        return luggageService.list();
    }

    @PostMapping("/luggage")
    @ResponseStatus(HttpStatus.CREATED)
    public LuggageResponse register(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @Valid @RequestBody RegisterLuggageRequest request) {
        String ownerEmail = authService.findByAuthorization(authorization)
                .map(user -> user.getEmail())
                .orElse(null);
        return luggageService.register(request, ownerEmail);
    }

    @GetMapping("/luggage/{trackingCode}")
    public LuggageResponse track(@PathVariable String trackingCode) {
        return luggageService.findByTrackingCode(trackingCode);
    }

    @GetMapping("/verify/{code}")
    public LuggageResponse verifyCode(@PathVariable String code) {
        return luggageService.findByTrackingCodeOrRfid(code);
    }

    @PostMapping("/luggage/{trackingCode}/payment")
    public LuggageResponse confirmPayment(@PathVariable String trackingCode, @Valid @RequestBody PaymentRequest request) {
        return luggageService.confirmPayment(trackingCode, request);
    }

    @PostMapping("/luggage/{trackingCode}/dispatch")
    public LuggageResponse dispatch(@PathVariable String trackingCode) {
        return luggageService.dispatch(trackingCode);
    }

    @PostMapping("/luggage/{trackingCode}/scan")
    public LuggageResponse scanStop(@PathVariable String trackingCode, @Valid @RequestBody MoveLuggageRequest request) {
        return luggageService.scanStop(trackingCode, request);
    }

    @PostMapping("/luggage/{trackingCode}/verify-pickup")
    public LuggageResponse verifyPickup(
            @PathVariable String trackingCode,
            @Valid @RequestBody PickupVerificationRequest request) {
        return luggageService.verifyPickup(trackingCode, request);
    }
}
