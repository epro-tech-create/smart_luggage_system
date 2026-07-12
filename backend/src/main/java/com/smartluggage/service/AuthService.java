package com.smartluggage.service;

import com.smartluggage.dto.AuthResponse;
import com.smartluggage.dto.LoginRequest;
import com.smartluggage.dto.RegisterUserRequest;
import com.smartluggage.model.UserAccount;
import com.smartluggage.model.UserRole;
import com.smartluggage.repository.UserAccountRepository;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserAccountRepository userAccountRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
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
        user.setRole(UserRole.USER);
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
    public void seedAccount(String fullName, String email, String phone, String password, UserRole role) {
        if (userAccountRepository.existsByEmailIgnoreCase(email)) {
            return;
        }
        UserAccount user = new UserAccount();
        user.setFullName(fullName);
        user.setEmail(email.toLowerCase(Locale.ROOT));
        user.setPhoneNumber(phone);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        userAccountRepository.save(user);
    }

    private void issueToken(UserAccount user) {
        user.setSessionToken(UUID.randomUUID().toString());
        user.setTokenCreatedAt(Instant.now());
        user.setLastLoginAt(Instant.now());
    }

    private UserRole resolveRole(String role) {
        if (role == null || role.isBlank()) {
            return UserRole.USER;
        }
        return "ADMIN".equalsIgnoreCase(role.trim()) ? UserRole.ADMIN : UserRole.USER;
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
                user.getSessionToken(),
                user.getLastLoginAt());
    }
}
