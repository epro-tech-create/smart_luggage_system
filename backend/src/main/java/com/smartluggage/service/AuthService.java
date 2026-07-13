package com.smartluggage.service;

import com.smartluggage.dto.AuthResponse;
import com.smartluggage.dto.LoginRequest;
import com.smartluggage.dto.ManageUserRequest;
import com.smartluggage.dto.RegisterUserRequest;
import com.smartluggage.dto.UpdateAccountRequest;
import com.smartluggage.dto.UserAccountResponse;
import com.smartluggage.model.Luggage;
import com.smartluggage.model.UserAccount;
import com.smartluggage.model.UserRole;
import com.smartluggage.repository.LuggageRepository;
import com.smartluggage.repository.UserAccountRepository;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserAccountRepository userAccountRepository;
    private final LuggageRepository luggageRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserAccountRepository userAccountRepository, LuggageRepository luggageRepository) {
        this.userAccountRepository = userAccountRepository;
        this.luggageRepository = luggageRepository;
    }

    @Transactional
    public AuthResponse register(RegisterUserRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userAccountRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("An account already exists for " + email);
        }

        UserAccount user = new UserAccount();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPhoneNumber(request.phoneNumber());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.CUSTOMER);
        issueToken(user);
        return toResponse(userAccountRepository.save(user));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        UserAccount user = userAccountRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }
        if (!user.isActive()) {
            throw new IllegalArgumentException("This account is inactive. Contact your administrator.");
        }
        UserRole selectedRole = user.getRole();
        if (request.selectedRole() != null && !request.selectedRole().isBlank()) {
            try {
                selectedRole = UserRole.valueOf(request.selectedRole().trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException exception) {
                throw new IllegalArgumentException("The selected role is not valid.");
            }
        }
        if (user.getRole() != selectedRole) {
            throw new IllegalArgumentException("The selected role is not assigned to this account.");
        }
        issueToken(user);
        return toResponse(userAccountRepository.save(user));
    }

    @Transactional(readOnly = true)
    public Optional<UserAccount> findByAuthorization(String authorization) {
        String token = bearerToken(authorization);
        if (token == null) {
            return Optional.empty();
        }
        return userAccountRepository.findBySessionToken(token);
    }

    @Transactional(readOnly = true)
    public AuthResponse me(String authorization) {
        return findByAuthorization(authorization)
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Login required."));
    }

    @Transactional
    public AuthResponse updateMe(String authorization, UpdateAccountRequest request) {
        UserAccount user = requireAuthenticated(authorization);
        String currentEmail = user.getEmail();
        String nextEmail = request.email().trim().toLowerCase(Locale.ROOT);
        userAccountRepository.findByEmailIgnoreCase(nextEmail)
                .filter(existing -> !existing.getId().equals(user.getId()))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("An account already exists for " + nextEmail);
                });

        if (currentEmail != null && !currentEmail.equalsIgnoreCase(nextEmail)) {
            List<Luggage> ownedLuggage = luggageRepository.findByOwnerEmailIgnoreCase(currentEmail);
            ownedLuggage.forEach(luggage -> luggage.setOwnerEmail(nextEmail));
            luggageRepository.saveAll(ownedLuggage);
        }

        user.setFullName(request.fullName().trim());
        user.setEmail(nextEmail);
        user.setPhoneNumber(request.phoneNumber());
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        return toResponse(userAccountRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<UserAccountResponse> listUsers() {
        return userAccountRepository.findAll().stream().map(this::toUserAccountResponse).toList();
    }

    @Transactional
    public UserAccountResponse createManagedUser(ManageUserRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userAccountRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("An account already exists for " + email);
        }
        if (request.password() == null || request.password().isBlank()) {
            throw new IllegalArgumentException("Password is required for a new user.");
        }
        UserAccount user = new UserAccount();
        applyManagedFields(user, request, email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        return toUserAccountResponse(userAccountRepository.save(user));
    }

    @Transactional
    public UserAccountResponse updateManagedUser(Long id, ManageUserRequest request) {
        UserAccount user = userAccountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        userAccountRepository.findByEmailIgnoreCase(email)
                .filter(existing -> !existing.getId().equals(user.getId()))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("An account already exists for " + email);
                });
        applyManagedFields(user, request, email);
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        return toUserAccountResponse(userAccountRepository.save(user));
    }

    @Transactional
    public void deleteManagedUser(Long id, Long currentUserId) {
        if (id.equals(currentUserId)) {
            throw new IllegalArgumentException("You cannot remove your own administrator account.");
        }
        if (!userAccountRepository.existsById(id)) {
            throw new IllegalArgumentException("User not found.");
        }
        userAccountRepository.deleteById(id);
    }

    @Transactional
    public void seedAccount(String fullName, String email, String phone, String password, UserRole role, String busCompany, String terminal) {
        if (userAccountRepository.existsByEmailIgnoreCase(email)) {
            return;
        }
        UserAccount user = new UserAccount();
        user.setFullName(fullName);
        user.setEmail(email.toLowerCase(Locale.ROOT));
        user.setPhoneNumber(phone);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        user.setBusCompany(busCompany);
        user.setAssignedTerminal(terminal);
        userAccountRepository.save(user);
    }

    public UserAccount requireAuthenticated(String authorization) {
        UserAccount user = findByAuthorization(authorization)
                .orElseThrow(() -> new SecurityException("Authentication is required."));
        if (!user.isActive()) {
            throw new SecurityException("This account is inactive.");
        }
        return user;
    }

    public UserAccount requireRole(String authorization, UserRole... roles) {
        UserAccount user = requireAuthenticated(authorization);
        for (UserRole role : roles) {
            if (user.getRole() == role) return user;
        }
        throw new SecurityException("You do not have permission for this action.");
    }

    private void issueToken(UserAccount user) {
        user.setSessionToken(UUID.randomUUID().toString());
        user.setTokenCreatedAt(Instant.now());
        user.setLastLoginAt(Instant.now());
    }

    private String bearerToken(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return null;
        }
        return authorization.substring("Bearer ".length()).trim();
    }

    private AuthResponse toResponse(UserAccount user) {
        return new AuthResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getRole(),
                user.getBusCompany(),
                user.getAssignedTerminal(),
                user.getSessionToken(),
                user.getLastLoginAt());
    }

    private void applyManagedFields(UserAccount user, ManageUserRequest request, String email) {
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPhoneNumber(request.phoneNumber());
        user.setRole(request.role());
        user.setBusCompany(request.busCompany());
        user.setAssignedTerminal(request.assignedTerminal());
        user.setActive(request.active() == null || request.active());
    }

    private UserAccountResponse toUserAccountResponse(UserAccount user) {
        return new UserAccountResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getRole(),
                user.getBusCompany(),
                user.getAssignedTerminal(),
                user.isActive(),
                user.getCreatedAt(),
                user.getLastLoginAt());
    }
}
