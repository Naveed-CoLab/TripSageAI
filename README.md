# AI Trip Planner - TripSage  (PERN Stack)

The AI Trip Planner leverages advanced PostgreSQL functionalities to ensure robust data handling, consistency, transparency, and seamless auditability throughout the platform.

# Video Demonstration:

## PostgreSQL Features Implemented

### 1. Triggers

The application uses PostgreSQL triggers for automatic actions on data changes:

- **update_timestamp**: Automatically updates the `updated_at` timestamp column whenever a record is updated
  - Applied to: `users`, `my_trips`, `user_settings`, `flight_bookings`, `hotel_bookings`, `reviews`
  
- **log_activity**: Logs changes to important tables in the `analytics` and `admin_logs` tables
  - Applied to: `users`, `my_trips`, `destinations`, `flight_bookings`, `hotel_bookings`, `notifications`, `reviews`, `booking_approvals`

### 2. Stored Procedures

The application uses stored procedures for encapsulating and centralizing business logic:

- **create_trip**: Creates a new trip with initial data and logs the activity
- **register_user**: Registers a new user with default settings and logs the activity
- **process_booking_approval**: Processes a booking approval workflow and sends notifications
- **get_trip_statistics**: Generates statistics about trips in the system

### 3. Transactions

The application uses transactions to ensure data consistency for multi-step operations:

- **Enhanced transaction helper**: Provides detailed logging and automatic error handling
- **Isolation level support**: Allows specifying READ COMMITTED, REPEATABLE READ, or SERIALIZABLE isolation
- **Error mapping**: Maps PostgreSQL error codes to user-friendly error messages

## Using PostgreSQL Features

### Running Database Migrations

To apply the PostgreSQL triggers and stored procedures, run:

```bash
npx tsx scripts/run-migrations.ts
```

### Setting Up PostgreSQL Features

To set up all advanced PostgreSQL features (triggers, stored procedures, etc.), run:

```bash
npx tsx scripts/setup-postgresql-features.ts
```

### Testing PostgreSQL Features

To verify that all the PostgreSQL features are working correctly, run:

```bash
npx tsx scripts/test-postgresql-features.ts
```

## Example Usage in Code

### Using Transactions

```typescript
import { transaction } from '../server/db';

// Simple transaction
await transaction(async (client) => {
  await client.query('INSERT INTO users (username) VALUES ($1)', ['user1']);
  await client.query('INSERT INTO user_settings (user_id) VALUES ($1)', [1]);
});

// Transaction with custom options
await transaction(
  async (client) => {
    
  }, 
  { 
    name: 'important_operation',
    isolation: 'SERIALIZABLE'
  }
);
```

### Using Stored Procedures

```typescript
import { query } from '../server/db';

// Register a new user
await query(
  `CALL register_user($1, $2, $3, $4, $5, $6, $7, $8)`,
  [
    'username',
    'email@example.com',
    'hashed_password',
    'First',
    'Last',
    null,
    'Bio text',
    '+1234567890'
  ]
);

// Process a booking approval
await query(
  `CALL process_booking_approval($1, $2, $3, $4, $5)`,
  ['flight', 123, 1, 'approved', 'Booking approved by admin']
);
```

## Database Schema Organization

- **Automatic timestamps**: All tables with `updated_at` columns automatically get their values updated on change
- **Transactional integrity**: Complex operations are wrapped in transactions to ensure consistency
