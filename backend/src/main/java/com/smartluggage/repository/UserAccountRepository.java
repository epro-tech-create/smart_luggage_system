package com.smartluggage.repository;

import com.smartluggage.model.UserAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByEmailIgnoreCase(String email);

    Optional<UserAccount> findBySessionToken(String sessionToken);

    boolean existsByEmailIgnoreCase(String email);
}
