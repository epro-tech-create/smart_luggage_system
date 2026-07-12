package com.smartluggage.repository;

import com.smartluggage.model.Payment;
import com.smartluggage.model.PaymentStatus;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    long countByStatus(PaymentStatus status);

    @Query("select sum(p.amount) from Payment p where p.status = com.smartluggage.model.PaymentStatus.CONFIRMED")
    BigDecimal confirmedRevenue();
}
