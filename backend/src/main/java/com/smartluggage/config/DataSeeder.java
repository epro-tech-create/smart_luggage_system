package com.smartluggage.config;

import com.smartluggage.dto.MoveLuggageRequest;
import com.smartluggage.dto.PaymentRequest;
import com.smartluggage.dto.RegisterLuggageRequest;
import com.smartluggage.repository.LuggageRepository;
import com.smartluggage.model.UserRole;
import com.smartluggage.service.AuthService;
import com.smartluggage.service.LuggageService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

@Configuration
public class DataSeeder {
    @Bean
    @Order(10)
    CommandLineRunner seedDemoData(LuggageRepository luggageRepository, LuggageService luggageService, AuthService authService) {
        return args -> {
            authService.seedAccount("Zawadi Msongo", "superadmin@safiribag.co.tz", "+255700000001", "admin123", UserRole.SUPER_ADMINISTRATOR, null, null);
            authService.seedAccount("Baraka Transport", "company@safiribag.co.tz", "+255700000003", "company123", UserRole.BUS_COMPANY_ADMINISTRATOR, "Safiri Express", null);
            authService.seedAccount("Patrick Mmari", "officer@safiribag.co.tz", "+255700000004", "officer123", UserRole.TERMINAL_OFFICER, "Safiri Express", "Dar es Salaam - Magufuli Terminal");
            authService.seedAccount("Amina Juma Bakari", "user@safiribag.co.tz", "+255700000002", "user123", UserRole.CUSTOMER, null, null);

            if (luggageRepository.count() > 0) {
                return;
            }

            var first = luggageService.register(new RegisterLuggageRequest(
                    "Tumsifu Joseph",
                    "+255713000111",
                    "Asha Mwakalinga",
                    "+255713000222",
                    "Dar es Salaam - Magufuli Terminal",
                    "Mwanza Nyegezi Terminal",
                    18.5,
                    "T 482 DFE"));
            luggageService.confirmPayment(first.trackingCode(), new PaymentRequest("M-Pesa", "+255713000111", "MPESA-4818"));
            luggageService.dispatch(first.trackingCode());

            var second = luggageService.register(new RegisterLuggageRequest(
                    "Cleopa Myovela",
                    "+255765000333",
                    "Venance Kasengelema",
                    "+255765000444",
                    "Arusha Central",
                    "Dodoma Main Terminal",
                    11.2,
                    "T 991 BDX"));
            luggageService.confirmPayment(second.trackingCode(), new PaymentRequest("Airtel Money", "+255765000333", "AIR-7731"));
            luggageService.dispatch(second.trackingCode());
            luggageService.scanStop(second.trackingCode(), new MoveLuggageRequest("Dodoma Main Terminal", "Correct arrival scan"));

            var third = luggageService.register(new RegisterLuggageRequest(
                    "Yohana Kalimanzila",
                    "+255754000555",
                    "Neema Joseph",
                    "+255754000666",
                    "Mbeya Main Bus Stand",
                    "Morogoro Msamvu",
                    24.0,
                    "T 118 CAV"));
            luggageService.confirmPayment(third.trackingCode(), new PaymentRequest("Tigo Pesa", "+255754000555", "TIGO-2084"));
            luggageService.dispatch(third.trackingCode());
            luggageService.scanStop(third.trackingCode(), new MoveLuggageRequest("Iringa Terminal", "Unauthorized offload scan"));
        };
    }
}
