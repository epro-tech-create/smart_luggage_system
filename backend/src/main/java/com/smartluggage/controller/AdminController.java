package com.smartluggage.controller;

import com.smartluggage.dto.AdminOverview;
import com.smartluggage.model.PaymentStatus;
import com.smartluggage.model.UserRole;
import com.smartluggage.repository.LuggageRepository;
import com.smartluggage.repository.PaymentRepository;
import com.smartluggage.repository.UserAccountRepository;
import com.smartluggage.service.AuthService;
import java.math.BigDecimal;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AuthService authService;
    private final UserAccountRepository userAccountRepository;
    private final LuggageRepository luggageRepository;
    private final PaymentRepository paymentRepository;

    public AdminController(
            AuthService authService,
            UserAccountRepository userAccountRepository,
            LuggageRepository luggageRepository,
            PaymentRepository paymentRepository) {
        this.authService = authService;
        this.userAccountRepository = userAccountRepository;
        this.luggageRepository = luggageRepository;
        this.paymentRepository = paymentRepository;
    }

    @GetMapping("/overview")
    public AdminOverview overview(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        var user = authService.findByAuthorization(authorization)
                .orElseThrow(() -> new IllegalArgumentException("Admin login required."));
        if (user.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Admin access required.");
        }
        BigDecimal revenue = paymentRepository.confirmedRevenue();
        return new AdminOverview(
                userAccountRepository.count(),
                luggageRepository.count(),
                paymentRepository.countByStatus(PaymentStatus.CONFIRMED),
                revenue == null ? BigDecimal.ZERO : revenue);
    }
}
