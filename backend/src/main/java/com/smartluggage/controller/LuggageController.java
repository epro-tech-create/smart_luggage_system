package com.smartluggage.controller;

import com.smartluggage.dto.DashboardStats;
import com.smartluggage.dto.LuggageResponse;
import com.smartluggage.dto.MoveLuggageRequest;
import com.smartluggage.dto.PaymentRequest;
import com.smartluggage.dto.PickupVerificationRequest;
import com.smartluggage.dto.RegisterLuggageRequest;
import com.smartluggage.service.LuggageService;
import com.smartluggage.service.AuthService;
import com.smartluggage.model.UserAccount;
import com.smartluggage.model.UserRole;
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
    public DashboardStats dashboardStats(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        UserAccount user = authService.requireAuthenticated(authorization);
        if (user.getRole() == UserRole.SUPER_ADMINISTRATOR) return luggageService.dashboardStats();
        List<LuggageResponse> scoped = switch (user.getRole()) {
            case BUS_COMPANY_ADMINISTRATOR -> luggageService.listForCompany(requiredCompany(user));
            case TERMINAL_OFFICER -> luggageService.listForTerminal(requiredCompany(user), requiredTerminal(user));
            case CUSTOMER -> luggageService.listForOwner(user.getEmail());
            case SUPER_ADMINISTRATOR -> List.of();
        };
        return luggageService.dashboardStatsFor(scoped);
    }

    @GetMapping("/luggage")
    public List<LuggageResponse> list(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        UserAccount user = authService.requireAuthenticated(authorization);
        return switch (user.getRole()) {
            case SUPER_ADMINISTRATOR -> luggageService.list();
            case BUS_COMPANY_ADMINISTRATOR -> luggageService.listForCompany(requiredCompany(user));
            case TERMINAL_OFFICER -> luggageService.listForTerminal(requiredCompany(user), requiredTerminal(user));
            case CUSTOMER -> luggageService.listForOwner(user.getEmail());
        };
    }

    @PostMapping("/luggage")
    @ResponseStatus(HttpStatus.CREATED)
    public LuggageResponse register(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @Valid @RequestBody RegisterLuggageRequest request) {
        UserAccount user = authService.requireRole(authorization, UserRole.CUSTOMER, UserRole.TERMINAL_OFFICER);
        String company = user.getRole() == UserRole.TERMINAL_OFFICER ? requiredCompany(user) : "Safiri Express";
        return luggageService.register(request, user.getRole() == UserRole.CUSTOMER ? user.getEmail() : null, company);
    }

    @GetMapping("/luggage/{trackingCode}")
    public LuggageResponse track(@PathVariable String trackingCode,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        UserAccount user = authService.requireAuthenticated(authorization);
        LuggageResponse luggage = luggageService.findByTrackingCode(trackingCode);
        assertCanAccess(user, luggage);
        return luggage;
    }

    @GetMapping("/verify/{code}")
    public LuggageResponse verifyCode(@PathVariable String code,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        UserAccount user = authService.requireRole(authorization, UserRole.TERMINAL_OFFICER, UserRole.BUS_COMPANY_ADMINISTRATOR, UserRole.SUPER_ADMINISTRATOR);
        LuggageResponse luggage = luggageService.findByTrackingCodeOrRfid(code);
        assertCanAccess(user, luggage);
        return luggage;
    }

    @PostMapping("/luggage/{trackingCode}/payment")
    public LuggageResponse confirmPayment(@PathVariable String trackingCode, @Valid @RequestBody PaymentRequest request,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        UserAccount user = authService.requireRole(authorization, UserRole.BUS_COMPANY_ADMINISTRATOR, UserRole.SUPER_ADMINISTRATOR);
        assertCanAccess(user, luggageService.findByTrackingCode(trackingCode));
        return luggageService.confirmPayment(trackingCode, request);
    }

    @PostMapping("/luggage/{trackingCode}/dispatch")
    public LuggageResponse dispatch(@PathVariable String trackingCode,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        UserAccount user = authService.requireRole(authorization, UserRole.TERMINAL_OFFICER, UserRole.BUS_COMPANY_ADMINISTRATOR, UserRole.SUPER_ADMINISTRATOR);
        LuggageResponse luggage = luggageService.findByTrackingCode(trackingCode);
        assertCanAccess(user, luggage);
        if (user.getRole() == UserRole.TERMINAL_OFFICER && !requiredTerminal(user).equalsIgnoreCase(luggage.currentTerminal())) {
            throw new SecurityException("Terminal officers can dispatch only from their assigned terminal.");
        }
        return luggageService.dispatch(trackingCode);
    }

    @PostMapping("/luggage/{trackingCode}/scan")
    public LuggageResponse scanStop(@PathVariable String trackingCode, @Valid @RequestBody MoveLuggageRequest request,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        UserAccount user = authService.requireRole(authorization, UserRole.TERMINAL_OFFICER, UserRole.BUS_COMPANY_ADMINISTRATOR, UserRole.SUPER_ADMINISTRATOR);
        LuggageResponse luggage = luggageService.findByTrackingCode(trackingCode);
        assertCanAccess(user, luggage);
        if (user.getRole() == UserRole.TERMINAL_OFFICER && !requiredTerminal(user).equalsIgnoreCase(request.terminal())) {
            throw new SecurityException("Terminal officers can process arrivals only at their assigned terminal.");
        }
        return luggageService.scanStop(trackingCode, request);
    }

    @PostMapping("/luggage/{trackingCode}/verify-pickup")
    public LuggageResponse verifyPickup(
            @PathVariable String trackingCode,
            @Valid @RequestBody PickupVerificationRequest request,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        UserAccount user = authService.requireRole(authorization, UserRole.TERMINAL_OFFICER, UserRole.BUS_COMPANY_ADMINISTRATOR, UserRole.SUPER_ADMINISTRATOR);
        LuggageResponse luggage = luggageService.findByTrackingCode(trackingCode);
        assertCanAccess(user, luggage);
        if (user.getRole() == UserRole.TERMINAL_OFFICER && !requiredTerminal(user).equalsIgnoreCase(luggage.currentTerminal())) {
            throw new SecurityException("Terminal officers can release luggage only at their assigned terminal.");
        }
        return luggageService.verifyPickup(trackingCode, request);
    }

    private void assertCanAccess(UserAccount user, LuggageResponse luggage) {
        if (user.getRole() == UserRole.SUPER_ADMINISTRATOR) return;
        if (user.getRole() == UserRole.CUSTOMER && user.getEmail().equalsIgnoreCase(luggage.ownerEmail())) return;
        if ((user.getRole() == UserRole.BUS_COMPANY_ADMINISTRATOR || user.getRole() == UserRole.TERMINAL_OFFICER)
                && requiredCompany(user).equalsIgnoreCase(luggage.busCompany())) return;
        throw new SecurityException("This luggage record is outside your permitted scope.");
    }

    private String requiredCompany(UserAccount user) {
        if (user.getBusCompany() == null || user.getBusCompany().isBlank()) throw new SecurityException("No bus company assignment is configured.");
        return user.getBusCompany();
    }

    private String requiredTerminal(UserAccount user) {
        if (user.getAssignedTerminal() == null || user.getAssignedTerminal().isBlank()) throw new SecurityException("No terminal assignment is configured.");
        return user.getAssignedTerminal();
    }
}
