# Smart Luggage Tracking System - Database Schema

Database: `smart_luggage_system`  
Database engine: PostgreSQL  
Backend ORM: Spring Data JPA / Hibernate  
Schema mode: `spring.jpa.hibernate.ddl-auto=update`

Paste-ready SQL schema file:

[database_schema.sql](database_schema.sql)

You can open that file, copy everything, and run it in pgAdmin Query Tool or `psql` to create the same tables.

Connection defaults:

```properties
DB_URL=jdbc:postgresql://localhost:5432/smart_luggage_system
DB_USERNAME=postgres
DB_PASSWORD=zzql@1234
```

## Entity Relationship Overview

```text
user_accounts
  |-- user_account_roles -- roles -- role_permissions

luggage
  |-- payments
  |-- tracking_events
  |-- notification_logs
```

## Tables

### `user_accounts`

Stores every person who can log in: customer, terminal officer, bus company administrator, and super administrator.

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | bigint, primary key | User ID |
| `full_name` | varchar | User full name |
| `email` | varchar, unique, not null | Login email |
| `password_hash` | varchar | BCrypt password hash |
| `role` | varchar | Main role enum |
| `phone_number` | varchar | Contact phone |
| `bus_company` | varchar | Company scope for bus company admins/officers |
| `assigned_terminal` | varchar | Terminal scope for terminal officers |
| `active` | boolean, default true | Account enabled/disabled |
| `session_token` | varchar | Current login session token |
| `token_created_at` | timestamptz | Session token issue time |
| `last_login_at` | timestamptz | Most recent login time |
| `created_at` | timestamptz | Account creation time |

Role values:

```text
SUPER_ADMINISTRATOR
BUS_COMPANY_ADMINISTRATOR
TERMINAL_OFFICER
CUSTOMER
```

Notes:
- Super admins can manage users and luggage.
- Bus company admins are scoped by `bus_company`.
- Terminal officers are scoped by both `bus_company` and `assigned_terminal`.
- Customers are scoped by `email`, which links to `luggage.owner_email`.

### `roles`

System role registry used for role metadata and permissions.

| Column | Type | Purpose |
| --- | --- | --- |
| `code` | varchar(64), primary key | Role enum code |
| `display_name` | varchar(120) | Human readable name |
| `description` | varchar(255) | Role description |
| `dashboard_path` | varchar(120) | Frontend home path |
| `system_role` | boolean | Marks built-in role |
| `created_at` | timestamptz | Created time |

Seeded role paths:

```text
SUPER_ADMINISTRATOR        -> /admin
BUS_COMPANY_ADMINISTRATOR  -> /company
TERMINAL_OFFICER           -> /officer
CUSTOMER                   -> /customer
```

### `role_permissions`

Permission keys assigned to roles.

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | bigserial, primary key | Permission row ID |
| `role_code` | varchar(64), foreign key | References `roles.code` |
| `permission_key` | varchar(120) | Permission string |
| `description` | varchar(255) | Permission description |

Unique constraint:

```text
(role_code, permission_key)
```

Examples:

```text
users.manage
roles.manage
luggage.view_all
luggage.view_company
luggage.register
luggage.track_own
payment.pay
pickup.release
```

### `user_account_roles`

Join table for assigning extra roles to a user account.

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | bigserial, primary key | Assignment ID |
| `user_account_id` | bigint, foreign key | References `user_accounts.id` |
| `role_code` | varchar(64), foreign key | References `roles.code` |
| `assigned_at` | timestamptz | Assignment time |

Unique constraint:

```text
(user_account_id, role_code)
```

### `luggage`

Main luggage/order table.

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | bigint, primary key | Luggage row ID |
| `tracking_code` | varchar | Public tracking ID |
| `qr_code` | varchar | QR identifier |
| `pickup_pin` | varchar | PIN required for pickup |
| `sender_name` | varchar | Sender/customer name |
| `sender_phone` | varchar | Sender/customer phone |
| `receiver_name` | varchar | Receiver name |
| `receiver_phone` | varchar | Receiver phone |
| `origin_terminal` | varchar | Starting terminal |
| `destination_terminal` | varchar | Destination terminal |
| `current_terminal` | varchar | Current known terminal |
| `weight_kg` | double precision | Luggage weight |
| `cost` | numeric | Calculated price |
| `bus_number` | varchar | Assigned bus |
| `rfid_tag` | varchar | RFID tag number |
| `owner_email` | varchar | Customer owner email |
| `bus_company` | varchar | Assigned company |
| `status` | varchar | Luggage status enum |
| `created_at` | timestamptz | Registration time |
| `updated_at` | timestamptz | Last update time |

Status values:

```text
REGISTERED
PAID
IN_TRANSIT
WRONG_DESTINATION_ALERT
ARRIVED
VERIFIED_PICKUP
CANCELLED
```

Lifecycle:

```text
REGISTERED -> PAID -> IN_TRANSIT -> ARRIVED -> VERIFIED_PICKUP
```

Exception flow:

```text
IN_TRANSIT -> WRONG_DESTINATION_ALERT
```

### `payments`

Stores mobile money/payment confirmations.

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | bigint, primary key | Payment ID |
| `luggage_id` | bigint, foreign key | References `luggage.id` |
| `amount` | numeric | Payment amount |
| `provider` | varchar | Payment provider, e.g. M-Pesa |
| `phone_number` | varchar | Payment phone |
| `transaction_reference` | varchar | Provider transaction reference |
| `payment_method` | varchar | Usually `MOBILE_MONEY` |
| `payment_status` | varchar | External status text |
| `payer_phone` | varchar | Payer phone |
| `status` | varchar | Internal payment status enum |
| `paid_at` | timestamptz | Payment confirmation time |

Payment status values:

```text
PENDING
CONFIRMED
FAILED
REFUNDED
```

### `tracking_events`

Stores the movement timeline for each luggage item.

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | bigint, primary key | Event ID |
| `luggage_id` | bigint, foreign key | References `luggage.id` |
| `event_type` | varchar | Event enum |
| `terminal` | varchar | Event location |
| `message` | varchar | Human-readable event note |
| `occurred_at` | timestamptz | Event time |

Event values:

```text
REGISTERED
PAID
DEPARTED
GPS_UPDATE
WRONG_DESTINATION
ARRIVED_AT_TERMINAL
PICKED_UP
```

### `notification_logs`

Stores sent notifications, currently SMS-style messages.

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | bigint, primary key | Notification ID |
| `luggage_id` | bigint, foreign key | References `luggage.id` |
| `phone_number` | varchar | Recipient phone |
| `channel` | varchar | Channel, e.g. SMS |
| `message` | varchar | Notification message |
| `sent_at` | timestamptz | Send time |

## Relationships

### User and Luggage Ownership

```text
user_accounts.email = luggage.owner_email
```

Used for customers. A customer can only see luggage where `owner_email` matches their email.

### Company Scope

```text
user_accounts.bus_company = luggage.bus_company
```

Used for bus company administrators and terminal officers.

### Terminal Scope

```text
user_accounts.assigned_terminal = luggage.current_terminal
```

Used for terminal officers when listing terminal-specific luggage.

### Luggage Children

```text
luggage.id = payments.luggage_id
luggage.id = tracking_events.luggage_id
luggage.id = notification_logs.luggage_id
```

## Security and Data Rules

### Customer

Can only access:

```sql
SELECT * FROM luggage WHERE owner_email = :logged_in_email;
```

### Terminal Officer

Can access luggage for assigned company and terminal:

```sql
SELECT *
FROM luggage
WHERE bus_company = :assigned_company
  AND current_terminal = :assigned_terminal;
```

### Bus Company Administrator

Can access all luggage for assigned company:

```sql
SELECT *
FROM luggage
WHERE bus_company = :assigned_company;
```

### Super Administrator

Can access and manage all records.

## Hibernate Naming Notes

Java fields use camelCase. PostgreSQL columns are generated using snake_case.

Examples:

```text
fullName            -> full_name
passwordHash        -> password_hash
trackingCode        -> tracking_code
pickupPin           -> pickup_pin
originTerminal      -> origin_terminal
destinationTerminal -> destination_terminal
ownerEmail          -> owner_email
busCompany          -> bus_company
```

## Useful Queries

All users:

```sql
SELECT id, full_name, email, role, bus_company, assigned_terminal, active
FROM user_accounts
ORDER BY id;
```

All luggage with owner and company:

```sql
SELECT tracking_code, sender_name, owner_email, bus_company, status, cost, created_at
FROM luggage
ORDER BY created_at DESC;
```

Revenue from confirmed payments:

```sql
SELECT COALESCE(SUM(amount), 0) AS confirmed_revenue
FROM payments
WHERE status = 'CONFIRMED';
```

Luggage count by status:

```sql
SELECT status, COUNT(*) AS total
FROM luggage
GROUP BY status
ORDER BY status;
```

Customer luggage:

```sql
SELECT *
FROM luggage
WHERE owner_email = 'user@safiribag.co.tz'
ORDER BY created_at DESC;
```

Company luggage:

```sql
SELECT *
FROM luggage
WHERE bus_company = 'Safiri Express'
ORDER BY created_at DESC;
```

Tracking timeline:

```sql
SELECT l.tracking_code, t.event_type, t.terminal, t.message, t.occurred_at
FROM tracking_events t
JOIN luggage l ON l.id = t.luggage_id
ORDER BY t.occurred_at DESC;
```
