package com.smartluggage.config;

import com.smartluggage.model.UserRole;
import java.util.Map;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(0)
public class RoleDatabaseInitializer implements CommandLineRunner {
    private final JdbcTemplate jdbcTemplate;

    public RoleDatabaseInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        repairUserAccountSchema();
        createRoleTables();
        seedRoles();
        seedPermissions();
    }

    private void repairUserAccountSchema() {
        jdbcTemplate.execute("ALTER TABLE IF EXISTS user_accounts DROP CONSTRAINT IF EXISTS user_accounts_role_check");
        jdbcTemplate.execute("ALTER TABLE IF EXISTS user_accounts ADD COLUMN IF NOT EXISTS active boolean");
        jdbcTemplate.execute("UPDATE user_accounts SET role = 'CUSTOMER' WHERE role = 'USER'");
        jdbcTemplate.execute("UPDATE user_accounts SET active = true WHERE active IS NULL");
        jdbcTemplate.execute("ALTER TABLE IF EXISTS user_accounts ALTER COLUMN active SET DEFAULT true");
    }

    private void createRoleTables() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS roles (
                    code varchar(64) PRIMARY KEY,
                    display_name varchar(120) NOT NULL,
                    description varchar(255) NOT NULL,
                    dashboard_path varchar(120) NOT NULL,
                    system_role boolean NOT NULL DEFAULT true,
                    created_at timestamptz NOT NULL DEFAULT now()
                )
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS role_permissions (
                    id bigserial PRIMARY KEY,
                    role_code varchar(64) NOT NULL REFERENCES roles(code) ON DELETE CASCADE,
                    permission_key varchar(120) NOT NULL,
                    description varchar(255) NOT NULL,
                    UNIQUE (role_code, permission_key)
                )
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS user_account_roles (
                    id bigserial PRIMARY KEY,
                    user_account_id bigint NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
                    role_code varchar(64) NOT NULL REFERENCES roles(code) ON DELETE CASCADE,
                    assigned_at timestamptz NOT NULL DEFAULT now(),
                    UNIQUE (user_account_id, role_code)
                )
                """);
    }

    private void seedRoles() {
        insertRole(UserRole.SUPER_ADMINISTRATOR, "Super Administrator", "Full system control across all terminals and companies.", "/admin");
        insertRole(UserRole.BUS_COMPANY_ADMINISTRATOR, "Bus Company Administrator", "Controls luggage and fleet operations for one bus company.", "/company");
        insertRole(UserRole.TERMINAL_OFFICER, "Terminal Officer", "Registers, scans, verifies, and releases luggage at assigned terminals.", "/officer");
        insertRole(UserRole.CUSTOMER, "Customer", "Tracks personal luggage, payments, notifications, and pickup PINs.", "/customer");
    }

    private void insertRole(UserRole role, String displayName, String description, String dashboardPath) {
        jdbcTemplate.update("""
                INSERT INTO roles (code, display_name, description, dashboard_path)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (code) DO UPDATE SET
                    display_name = EXCLUDED.display_name,
                    description = EXCLUDED.description,
                    dashboard_path = EXCLUDED.dashboard_path
                """, role.name(), displayName, description, dashboardPath);
    }

    private void seedPermissions() {
        Map<UserRole, String[]> permissions = Map.of(
                UserRole.SUPER_ADMINISTRATOR, new String[] {
                        "users.manage", "roles.manage", "luggage.view_all", "reports.view", "system.health"
                },
                UserRole.BUS_COMPANY_ADMINISTRATOR, new String[] {
                        "fleet.manage", "luggage.view_company", "luggage.dispatch", "reports.company"
                },
                UserRole.TERMINAL_OFFICER, new String[] {
                        "luggage.register", "luggage.scan", "payment.confirm", "pickup.release"
                },
                UserRole.CUSTOMER, new String[] {
                        "luggage.create_own", "luggage.track_own", "payment.pay", "notifications.view_own"
                });

        permissions.forEach((role, keys) -> {
            for (String key : keys) {
                jdbcTemplate.update("""
                        INSERT INTO role_permissions (role_code, permission_key, description)
                        VALUES (?, ?, ?)
                        ON CONFLICT (role_code, permission_key) DO NOTHING
                        """, role.name(), key, key.replace('.', ' '));
            }
        });
    }
}
