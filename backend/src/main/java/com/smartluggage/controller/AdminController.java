package com.smartluggage.controller;

import com.smartluggage.dto.AdminOverview;
import com.smartluggage.dto.LuggageResponse;
import com.smartluggage.dto.ManageUserRequest;
import com.smartluggage.dto.RegisterLuggageRequest;
import com.smartluggage.dto.UpdateLuggageRequest;
import com.smartluggage.dto.UserAccountResponse;
import com.smartluggage.model.PaymentStatus;
import com.smartluggage.model.UserRole;
import com.smartluggage.repository.LuggageRepository;
import com.smartluggage.repository.PaymentRepository;
import com.smartluggage.repository.UserAccountRepository;
import com.smartluggage.service.AuthService;
import com.smartluggage.service.LuggageService;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AuthService authService;
    private final UserAccountRepository userAccountRepository;
    private final LuggageRepository luggageRepository;
    private final PaymentRepository paymentRepository;
    private final LuggageService luggageService;

    public AdminController(
            AuthService authService,
            UserAccountRepository userAccountRepository,
            LuggageRepository luggageRepository,
            PaymentRepository paymentRepository,
            LuggageService luggageService) {
        this.authService = authService;
        this.userAccountRepository = userAccountRepository;
        this.luggageRepository = luggageRepository;
        this.paymentRepository = paymentRepository;
        this.luggageService = luggageService;
    }

    @GetMapping("/overview")
    public AdminOverview overview(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        requireSuperAdmin(authorization);
        BigDecimal revenue = paymentRepository.confirmedRevenue();
        return new AdminOverview(
                userAccountRepository.count(),
                luggageRepository.count(),
                paymentRepository.countByStatus(PaymentStatus.CONFIRMED),
                revenue == null ? BigDecimal.ZERO : revenue);
    }

    @GetMapping("/users")
    public List<UserAccountResponse> users(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        requireSuperAdmin(authorization);
        return authService.listUsers();
    }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public UserAccountResponse createUser(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @Valid @RequestBody ManageUserRequest request) {
        requireSuperAdmin(authorization);
        return authService.createManagedUser(request);
    }

    @PutMapping("/users/{id}")
    public UserAccountResponse updateUser(
            @PathVariable Long id,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @Valid @RequestBody ManageUserRequest request) {
        requireSuperAdmin(authorization);
        return authService.updateManagedUser(id, request);
    }

    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(
            @PathVariable Long id,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        var admin = requireSuperAdmin(authorization);
        authService.deleteManagedUser(id, admin.getId());
    }

    @GetMapping("/luggage")
    public List<LuggageResponse> luggage(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        requireSuperAdmin(authorization);
        return luggageService.list();
    }

    @PostMapping("/luggage")
    @ResponseStatus(HttpStatus.CREATED)
    public LuggageResponse createLuggage(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @Valid @RequestBody RegisterLuggageRequest request) {
        requireSuperAdmin(authorization);
        return luggageService.register(request, null, "Safiri Express");
    }

    @PutMapping("/luggage/{trackingCode}")
    public LuggageResponse updateLuggage(
            @PathVariable String trackingCode,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @Valid @RequestBody UpdateLuggageRequest request) {
        requireSuperAdmin(authorization);
        return luggageService.update(trackingCode, request, true);
    }

    @DeleteMapping("/luggage/{trackingCode}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteLuggage(
            @PathVariable String trackingCode,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        requireSuperAdmin(authorization);
        luggageService.delete(trackingCode);
    }

    private com.smartluggage.model.UserAccount requireSuperAdmin(String authorization) {
        return authService.requireRole(authorization, UserRole.SUPER_ADMINISTRATOR);
    }
}
