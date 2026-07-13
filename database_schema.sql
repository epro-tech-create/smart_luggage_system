-- Smart Luggage Tracking System PostgreSQL schema
-- Database name used by the app: smart_luggage_system
--
-- Usage:
-- 1. Create/select database smart_luggage_system.
-- 2. Paste and run this script in pgAdmin Query Tool or psql.

BEGIN;

CREATE TABLE IF NOT EXISTS user_accounts (
    id bigserial PRIMARY KEY,
    full_name varchar(255) NOT NULL,
    email varchar(255) NOT NULL UNIQUE,
    password_hash varchar(255) NOT NULL,
    role varchar(64) NOT NULL DEFAULT 'CUSTOMER',
    phone_number varchar(255),
    bus_company varchar(255),
    assigned_terminal varchar(255),
    active boolean NOT NULL DEFAULT true,
    session_token varchar(255),
    token_created_at timestamptz,
    last_login_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT user_accounts_role_check CHECK (
        role IN (
            'SUPER_ADMINISTRATOR',
            'BUS_COMPANY_ADMINISTRATOR',
            'TERMINAL_OFFICER',
            'CUSTOMER'
        )
    )
);

CREATE TABLE IF NOT EXISTS roles (
    code varchar(64) PRIMARY KEY,
    display_name varchar(120) NOT NULL,
    description varchar(255) NOT NULL,
    dashboard_path varchar(120) NOT NULL,
    system_role boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id bigserial PRIMARY KEY,
    role_code varchar(64) NOT NULL REFERENCES roles(code) ON DELETE CASCADE,
    permission_key varchar(120) NOT NULL,
    description varchar(255) NOT NULL,
    UNIQUE (role_code, permission_key)
);

CREATE TABLE IF NOT EXISTS user_account_roles (
    id bigserial PRIMARY KEY,
    user_account_id bigint NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
    role_code varchar(64) NOT NULL REFERENCES roles(code) ON DELETE CASCADE,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_account_id, role_code)
);

CREATE TABLE IF NOT EXISTS luggage (
    id bigserial PRIMARY KEY,
    tracking_code varchar(255) NOT NULL,
    qr_code varchar(255) NOT NULL,
    pickup_pin varchar(255) NOT NULL,
    sender_name varchar(255) NOT NULL,
    sender_phone varchar(255) NOT NULL,
    receiver_name varchar(255) NOT NULL,
    receiver_phone varchar(255) NOT NULL,
    origin_terminal varchar(255) NOT NULL,
    destination_terminal varchar(255) NOT NULL,
    current_terminal varchar(255),
    weight_kg double precision NOT NULL,
    cost numeric(38, 2) NOT NULL,
    bus_number varchar(255),
    rfid_tag varchar(255),
    owner_email varchar(255),
    bus_company varchar(255),
    status varchar(64) NOT NULL DEFAULT 'REGISTERED',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT luggage_weight_positive CHECK (weight_kg > 0),
    CONSTRAINT luggage_status_check CHECK (
        status IN (
            'REGISTERED',
            'PAID',
            'IN_TRANSIT',
            'WRONG_DESTINATION_ALERT',
            'ARRIVED',
            'VERIFIED_PICKUP',
            'CANCELLED'
        )
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_luggage_tracking_code
    ON luggage (lower(tracking_code));

CREATE UNIQUE INDEX IF NOT EXISTS idx_luggage_rfid_tag
    ON luggage (lower(rfid_tag))
    WHERE rfid_tag IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_luggage_owner_email
    ON luggage (lower(owner_email));

CREATE INDEX IF NOT EXISTS idx_luggage_bus_company
    ON luggage (lower(bus_company));

CREATE INDEX IF NOT EXISTS idx_luggage_company_terminal
    ON luggage (lower(bus_company), lower(current_terminal));

CREATE TABLE IF NOT EXISTS payments (
    id bigserial PRIMARY KEY,
    luggage_id bigint NOT NULL REFERENCES luggage(id) ON DELETE CASCADE,
    amount numeric(38, 2) NOT NULL,
    provider varchar(255),
    phone_number varchar(255),
    transaction_reference varchar(255),
    payment_method varchar(255) NOT NULL DEFAULT 'MOBILE_MONEY',
    payment_status varchar(255) NOT NULL DEFAULT 'SUCCESS',
    payer_phone varchar(255),
    status varchar(64) NOT NULL DEFAULT 'PENDING',
    paid_at timestamptz,
    CONSTRAINT payments_status_check CHECK (
        status IN ('PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED')
    )
);

CREATE INDEX IF NOT EXISTS idx_payments_luggage_id
    ON payments (luggage_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
    ON payments (status);

CREATE TABLE IF NOT EXISTS tracking_events (
    id bigserial PRIMARY KEY,
    luggage_id bigint NOT NULL REFERENCES luggage(id) ON DELETE CASCADE,
    event_type varchar(64) NOT NULL,
    terminal varchar(255),
    message varchar(500),
    occurred_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT tracking_events_type_check CHECK (
        event_type IN (
            'REGISTERED',
            'PAID',
            'DEPARTED',
            'GPS_UPDATE',
            'WRONG_DESTINATION',
            'ARRIVED_AT_TERMINAL',
            'PICKED_UP'
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_luggage_id
    ON tracking_events (luggage_id);

CREATE INDEX IF NOT EXISTS idx_tracking_events_occurred_at
    ON tracking_events (occurred_at);

CREATE TABLE IF NOT EXISTS notification_logs (
    id bigserial PRIMARY KEY,
    luggage_id bigint NOT NULL REFERENCES luggage(id) ON DELETE CASCADE,
    phone_number varchar(255),
    channel varchar(255),
    message varchar(500),
    sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_luggage_id
    ON notification_logs (luggage_id);

INSERT INTO roles (code, display_name, description, dashboard_path)
VALUES
    ('SUPER_ADMINISTRATOR', 'Super Administrator', 'Full system control across all terminals and companies.', '/admin'),
    ('BUS_COMPANY_ADMINISTRATOR', 'Bus Company Administrator', 'Controls luggage and fleet operations for one bus company.', '/company'),
    ('TERMINAL_OFFICER', 'Terminal Officer', 'Registers, scans, verifies, and releases luggage at assigned terminals.', '/officer'),
    ('CUSTOMER', 'Customer', 'Tracks personal luggage, payments, notifications, and pickup PINs.', '/customer')
ON CONFLICT (code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    dashboard_path = EXCLUDED.dashboard_path;

INSERT INTO role_permissions (role_code, permission_key, description)
VALUES
    ('SUPER_ADMINISTRATOR', 'users.manage', 'users manage'),
    ('SUPER_ADMINISTRATOR', 'roles.manage', 'roles manage'),
    ('SUPER_ADMINISTRATOR', 'luggage.view_all', 'luggage view all'),
    ('SUPER_ADMINISTRATOR', 'reports.view', 'reports view'),
    ('SUPER_ADMINISTRATOR', 'system.health', 'system health'),
    ('BUS_COMPANY_ADMINISTRATOR', 'fleet.manage', 'fleet manage'),
    ('BUS_COMPANY_ADMINISTRATOR', 'luggage.view_company', 'luggage view company'),
    ('BUS_COMPANY_ADMINISTRATOR', 'luggage.dispatch', 'luggage dispatch'),
    ('BUS_COMPANY_ADMINISTRATOR', 'reports.company', 'reports company'),
    ('TERMINAL_OFFICER', 'luggage.register', 'luggage register'),
    ('TERMINAL_OFFICER', 'luggage.scan', 'luggage scan'),
    ('TERMINAL_OFFICER', 'payment.confirm', 'payment confirm'),
    ('TERMINAL_OFFICER', 'pickup.release', 'pickup release'),
    ('CUSTOMER', 'luggage.create_own', 'luggage create own'),
    ('CUSTOMER', 'luggage.track_own', 'luggage track own'),
    ('CUSTOMER', 'payment.pay', 'payment pay'),
    ('CUSTOMER', 'notifications.view_own', 'notifications view own')
ON CONFLICT (role_code, permission_key) DO NOTHING;

COMMIT;
