# API Documentation - PostgreSQL Features

## Booking Service Endpoints

The booking service implements transactional operations, stored procedures, and triggers to ensure data consistency and auditability.

### Flight Bookings

#### Create Flight Booking

Creates a flight booking with transactional integrity, ensuring that the booking, approval request, analytics, and notification are all created atomically.

```
POST /api/bookings/flights
```

**Request Body:**
```json
{
  "userId": 2,
  "flightNumber": "QF123",
  "airline": "Qantas",
  "departureAirport": "SYD",
  "departureCode": "SYD",
  "departureTime": "2025-05-15T08:00:00Z",
  "arrivalAirport": "LAX",
  "arrivalCode": "LAX",
  "arrivalTime": "2025-05-15T22:30:00Z",
  "tripType": "ONE_WAY",
  "bookingReference": "QANTAS123456",
  "price": 1245.50,
  "currency": "USD",
  "cabinClass": "ECONOMY",
  "passengerName": "John Smith",
  "passengerEmail": "john@example.com",
  "passengerPhone": "+61412345678"
}
```

**Response:**
```json
{
  "id": 123,
  "userId": 2,
  "flightNumber": "QF123",
  "airline": "Qantas",
  "departureAirport": "SYD",
  "departureCode": "SYD",
  "departureTime": "2025-05-15T08:00:00Z",
  "arrivalAirport": "LAX",
  "arrivalCode": "LAX",
  "arrivalTime": "2025-05-15T22:30:00Z",
  "tripType": "ONE_WAY",
  "bookingReference": "QANTAS123456",
  "price": 1245.50,
  "currency": "USD",
  "status": "pending",
  "cabinClass": "ECONOMY",
  "passengerName": "John Smith",
  "passengerEmail": "john@example.com",
  "passengerPhone": "+61412345678",
  "createdAt": "2025-04-30T20:34:48.321Z",
  "updatedAt": "2025-04-30T20:34:48.321Z"
}
```

#### Approve Flight Booking

Approves a flight booking using the stored procedure, which updates the booking status, creates a notification, and logs the admin action.

```
POST /api/admin/bookings/flights/:id/approve
```

**Request Body:**
```json
{
  "adminId": 1,
  "notes": "Booking approved after payment verification"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Flight booking approved successfully"
}
```

#### Reject Flight Booking

Rejects a flight booking using the stored procedure, which updates the booking status, creates a notification, and logs the admin action.

```
POST /api/admin/bookings/flights/:id/reject
```

**Request Body:**
```json
{
  "adminId": 1,
  "notes": "Invalid payment information"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Flight booking rejected successfully"
}
```

### Hotel Bookings

Similar endpoints exist for hotel bookings with transactional integrity:

- `POST /api/bookings/hotels` - Create a hotel booking
- `POST /api/admin/bookings/hotels/:id/approve` - Approve a hotel booking
- `POST /api/admin/bookings/hotels/:id/reject` - Reject a hotel booking

## Trip Management with Stored Procedures

### Create Trip

Creates a trip using the stored procedure, which handles data insertion and activity logging.

```
POST /api/trips
```

**Request Body:**
```json
{
  "userId": 2,
  "title": "Summer Vacation in Hawaii",
  "destination": "Honolulu, Hawaii",
  "startDate": "2025-06-15",
  "endDate": "2025-06-30",
  "budget": "3000",
  "budgetIsEstimated": true,
  "preferences": ["beach", "relaxation", "food"],
  "status": "draft"
}
```

**Response:**
```json
{
  "id": 45,
  "userId": 2,
  "title": "Summer Vacation in Hawaii",
  "destination": "Honolulu, Hawaii",
  "startDate": "2025-06-15",
  "endDate": "2025-06-30",
  "budget": "3000",
  "budgetIsEstimated": true,
  "preferences": ["beach", "relaxation", "food"],
  "status": "draft",
  "createdAt": "2025-04-30T20:45:12.532Z",
  "updatedAt": "2025-04-30T20:45:12.532Z"
}
```

## Admin Statistics

### Get Trip Statistics

Retrieves trip statistics using the stored function.

```
GET /api/admin/statistics/trips
```

**Query Parameters:**
- `userId` (optional) - Filter statistics for a specific user
- `dateFrom` (optional) - Filter statistics from this date (YYYY-MM-DD)
- `dateTo` (optional) - Filter statistics to this date (YYYY-MM-DD)

**Response:**
```json
{
  "totalTrips": 145,
  "activeTrips": 32,
  "completedTrips": 98,
  "canceledTrips": 15,
  "topDestinations": ["Paris, France", "London, UK", "Tokyo, Japan", "New York, USA", "Rome, Italy"],
  "avgTripDuration": 8.5,
  "totalFlightBookings": 203,
  "totalHotelBookings": 187
}
```

## Usage of PostgreSQL Features

All of these API endpoints leverage the PostgreSQL features implemented in this project:

1. **Triggers**: Any updates to tables automatically update timestamps and log activities
2. **Stored Procedures**: Complex operations like booking approvals use stored procedures
3. **Transactions**: Multi-step operations are wrapped in transactions for consistency
4. **Functions**: Statistical queries use PostgreSQL functions for efficient calculation

   Note: Many Third Party APIs are also used in it 
