-- 1. Stored procedure for creating a new trip with initial data
CREATE OR REPLACE PROCEDURE create_trip(
    p_user_id INTEGER,
    p_title TEXT,
    p_destination TEXT,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_budget TEXT DEFAULT NULL,
    p_budget_is_estimated BOOLEAN DEFAULT false,
    p_preferences TEXT[] DEFAULT NULL,
    p_status TEXT DEFAULT 'draft',
    p_itinerary_data JSONB DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_trip_id INTEGER;
BEGIN
    -- Insert the new trip
    INSERT INTO my_trips (
        user_id, title, destination, start_date, end_date, 
        budget, budget_is_estimated, preferences, status, itinerary_data
    ) VALUES (
        p_user_id, p_title, p_destination, p_start_date, p_end_date,
        p_budget, p_budget_is_estimated, p_preferences, p_status, p_itinerary_data
    ) RETURNING id INTO v_trip_id;
    
    -- Record this activity in analytics
    INSERT INTO analytics (
        event_type, user_id, data
    ) VALUES (
        'trip_created', 
        p_user_id, 
        jsonb_build_object(
            'trip_id', v_trip_id,
            'title', p_title,
            'destination', p_destination,
            'start_date', p_start_date,
            'end_date', p_end_date
        )
    );
END;
$$;

-- 2. Stored procedure for user registration with default settings
CREATE OR REPLACE PROCEDURE register_user(
    p_username TEXT,
    p_email TEXT,
    p_password TEXT,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_profile_image TEXT DEFAULT NULL,
    p_bio TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    -- Insert the new user
    INSERT INTO users (
        username, email, password, first_name, last_name, profile_image, bio, phone, role, is_active
    ) VALUES (
        p_username, p_email, p_password, p_first_name, p_last_name, p_profile_image, p_bio, p_phone, 'user', true
    ) RETURNING id INTO v_user_id;
    
    -- Create default user settings
    INSERT INTO user_settings (
        user_id, theme, language, email_notifications, push_notifications, currency
    ) VALUES (
        v_user_id, 'light', 'en', true, true, 'USD'
    );
    
    -- Record this activity in analytics
    INSERT INTO analytics (
        event_type, user_id, data
    ) VALUES (
        'user_registered', 
        v_user_id, 
        jsonb_build_object(
            'username', p_username,
            'email', p_email,
            'registration_time', NOW()
        )
    );
END;
$$;

-- 3. Stored procedure for booking approval workflow
CREATE OR REPLACE PROCEDURE process_booking_approval(
    p_booking_type TEXT,
    p_booking_id INTEGER,
    p_admin_id INTEGER,
    p_approval_status TEXT,
    p_admin_notes TEXT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id INTEGER;
    v_booking_details JSONB;
    v_notification_title TEXT;
    v_notification_message TEXT;
    v_booking_reference TEXT;
    v_flight_number TEXT;
    v_hotel_name TEXT;
BEGIN
    -- Update booking approval status
    INSERT INTO booking_approvals (
        booking_type, booking_id, status, admin_id, admin_notes
    ) VALUES (
        p_booking_type, p_booking_id, p_approval_status, p_admin_id, p_admin_notes
    )
    ON CONFLICT (booking_type, booking_id) 
    DO UPDATE SET 
        status = p_approval_status,
        admin_id = p_admin_id,
        admin_notes = p_admin_notes,
        updated_at = NOW();
    
    -- Handle flight bookings
    IF p_booking_type = 'flight' THEN
        -- Get user id and booking info
        SELECT 
            user_id, 
            booking_reference,
            flight_number,
            jsonb_build_object(
                'flight_number', flight_number,
                'airline', airline,
                'departure', departure_airport,
                'arrival', arrival_airport,
                'booking_reference', booking_reference
            )
        INTO v_user_id, v_booking_reference, v_flight_number, v_booking_details
        FROM flight_bookings
        WHERE id = p_booking_id;
        
        -- Update flight status
        UPDATE flight_bookings 
        SET status = CASE 
                WHEN p_approval_status = 'approved' THEN 'confirmed'
                WHEN p_approval_status = 'rejected' THEN 'cancelled'
                ELSE status
            END
        WHERE id = p_booking_id;
        
        -- Set notification based on status
        IF p_approval_status = 'approved' THEN
            v_notification_title := 'Flight Booking Confirmed';
            v_notification_message := 'Your booking for flight ' || v_flight_number || 
                                     ' has been approved and confirmed.';
        ELSIF p_approval_status = 'rejected' THEN
            v_notification_title := 'Flight Booking Rejected';
            v_notification_message := 'Your booking for flight ' || v_flight_number || 
                                     ' has been rejected. Reason: ' || COALESCE(p_admin_notes, 'Not specified');
        END IF;
    
    -- Handle hotel bookings
    ELSIF p_booking_type = 'hotel' THEN
        -- Get user id and booking info
        SELECT 
            user_id, 
            booking_reference,
            hotel_name,
            jsonb_build_object(
                'hotel_name', hotel_name,
                'hotel_city', hotel_city,
                'check_in', check_in_date,
                'check_out', check_out_date,
                'booking_reference', booking_reference
            )
        INTO v_user_id, v_booking_reference, v_hotel_name, v_booking_details
        FROM hotel_bookings
        WHERE id = p_booking_id;
        
        -- Update hotel status
        UPDATE hotel_bookings 
        SET status = CASE 
                WHEN p_approval_status = 'approved' THEN 'CONFIRMED'
                WHEN p_approval_status = 'rejected' THEN 'CANCELLED'
                ELSE status
            END
        WHERE id = p_booking_id;
        
        -- Set notification based on status
        IF p_approval_status = 'approved' THEN
            v_notification_title := 'Hotel Booking Confirmed';
            v_notification_message := 'Your booking at ' || v_hotel_name || 
                                     ' has been approved and confirmed.';
        ELSIF p_approval_status = 'rejected' THEN
            v_notification_title := 'Hotel Booking Rejected';
            v_notification_message := 'Your booking at ' || v_hotel_name || 
                                     ' has been rejected. Reason: ' || COALESCE(p_admin_notes, 'Not specified');
        END IF;
    END IF;
    
    -- Create notification for the user
    IF p_approval_status IN ('approved', 'rejected') AND v_user_id IS NOT NULL THEN
        INSERT INTO notifications (
            user_id, admin_id, title, message, type, is_read, created_at
        ) VALUES (
            v_user_id, p_admin_id, v_notification_title, v_notification_message, 
            CASE 
                WHEN p_approval_status = 'approved' THEN 'success'
                ELSE 'warning'
            END,
            false, NOW()
        );
    END IF;
    
    -- Log the admin action
    INSERT INTO admin_logs (
        admin_id, action, entity_type, entity_id, details
    ) VALUES (
        p_admin_id, 
        'booking_' || p_approval_status, 
        p_booking_type || '_booking', 
        p_booking_id,
        jsonb_build_object(
            'booking_reference', v_booking_reference,
            'approval_status', p_approval_status,
            'admin_notes', p_admin_notes,
            'booking_details', v_booking_details
        )::TEXT
    );
END;
$$;

-- 4. Stored procedure to generate trip statistics
CREATE OR REPLACE FUNCTION get_trip_statistics(
    p_user_id INTEGER DEFAULT NULL,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
    total_trips INTEGER,
    active_trips INTEGER,
    completed_trips INTEGER,
    canceled_trips INTEGER,
    top_destinations TEXT[],
    avg_trip_duration NUMERIC,
    total_flight_bookings INTEGER,
    total_hotel_bookings INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH trip_stats AS (
        SELECT
            COUNT(*) AS total_trips,
            COUNT(*) FILTER(WHERE status = 'active') AS active_trips,
            COUNT(*) FILTER(WHERE status = 'completed') AS completed_trips,
            COUNT(*) FILTER(WHERE status = 'canceled') AS canceled_trips,
            ARRAY(
                SELECT destination 
                FROM my_trips
                WHERE (p_user_id IS NULL OR user_id = p_user_id)
                  AND (p_date_from IS NULL OR start_date >= p_date_from)
                  AND (p_date_to IS NULL OR end_date <= p_date_to)
                GROUP BY destination 
                ORDER BY COUNT(*) DESC 
                LIMIT 5
            ) AS top_destinations,
            AVG(EXTRACT(DAY FROM (end_date - start_date))) FILTER (WHERE end_date IS NOT NULL AND start_date IS NOT NULL) AS avg_trip_duration
        FROM my_trips
        WHERE (p_user_id IS NULL OR user_id = p_user_id)
          AND (p_date_from IS NULL OR start_date >= p_date_from)
          AND (p_date_to IS NULL OR end_date <= p_date_to)
    ),
    flight_stats AS (
        SELECT COUNT(*) AS total_flight_bookings
        FROM flight_bookings
        WHERE (p_user_id IS NULL OR user_id = p_user_id)
          AND (p_date_from IS NULL OR created_at::DATE >= p_date_from)
          AND (p_date_to IS NULL OR created_at::DATE <= p_date_to)
    ),
    hotel_stats AS (
        SELECT COUNT(*) AS total_hotel_bookings
        FROM hotel_bookings
        WHERE (p_user_id IS NULL OR user_id = p_user_id)
          AND (p_date_from IS NULL OR created_at::DATE >= p_date_from)
          AND (p_date_to IS NULL OR created_at::DATE <= p_date_to)
    )
    SELECT
        t.total_trips,
        t.active_trips,
        t.completed_trips,
        t.canceled_trips,
        t.top_destinations,
        t.avg_trip_duration,
        f.total_flight_bookings,
        h.total_hotel_bookings
    FROM trip_stats t, flight_stats f, hotel_stats h;
END;
$$;

-- Log the creation of stored procedures
INSERT INTO admin_logs (admin_id, action, entity_type, details)
SELECT 
    id, 
    'create_stored_procedures', 
    'database', 
    'Created stored procedures for common application operations'
FROM users 
WHERE role = 'admin' 
LIMIT 1;