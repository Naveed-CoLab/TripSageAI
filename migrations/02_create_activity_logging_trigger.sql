-- Create a function that logs changes to important tables
CREATE OR REPLACE FUNCTION log_table_activity()
RETURNS TRIGGER AS $$
DECLARE
    admin_user_id INTEGER;
    activity_type TEXT;
    details_json JSONB;
    entity_id INTEGER;
BEGIN
    -- Get an admin user for logging
    SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
    
    -- Default to admin user 1 if no admin exists
    IF admin_user_id IS NULL THEN
        admin_user_id := 1;
    END IF;
    
    -- Set entity ID
    entity_id := COALESCE(NEW.id, OLD.id);
    
    -- Determine activity type
    IF TG_OP = 'INSERT' THEN
        activity_type := 'create_' || TG_TABLE_NAME;
        details_json := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        activity_type := 'update_' || TG_TABLE_NAME;
        details_json := jsonb_build_object(
            'old', to_jsonb(OLD),
            'new', to_jsonb(NEW),
            'changes', (SELECT jsonb_object_agg(key, value) 
                        FROM jsonb_each(to_jsonb(NEW)) 
                        WHERE to_jsonb(NEW) ? key 
                        AND to_jsonb(OLD) ? key 
                        AND to_jsonb(NEW) ->> key <> to_jsonb(OLD) ->> key)
        );
    ELSIF TG_OP = 'DELETE' THEN
        activity_type := 'delete_' || TG_TABLE_NAME;
        details_json := to_jsonb(OLD);
    END IF;
    
    -- Log the activity in analytics table for user-related activities
    IF NEW.user_id IS NOT NULL OR OLD.user_id IS NOT NULL THEN
        INSERT INTO analytics (
            event_type, 
            user_id, 
            data
        ) VALUES (
            activity_type,
            COALESCE(NEW.user_id, OLD.user_id),
            details_json
        );
    END IF;

    -- For admin-specific activities, log them in admin_logs
    IF TG_TABLE_NAME IN ('users', 'destinations', 'notifications', 'booking_approvals') THEN
        INSERT INTO admin_logs (
            admin_id,
            action,
            entity_type,
            entity_id,
            details
        ) VALUES (
            admin_user_id,
            activity_type,
            TG_TABLE_NAME,
            entity_id,
            details_json::TEXT
        );
    END IF;
    
    -- Return appropriate record based on operation
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to important tables
CREATE OR REPLACE FUNCTION create_activity_logging_triggers()
RETURNS VOID AS $$
DECLARE
    table_name TEXT;
    tables TEXT[] := ARRAY[
        'users', 
        'my_trips', 
        'destinations', 
        'flight_bookings', 
        'hotel_bookings', 
        'notifications', 
        'reviews', 
        'booking_approvals'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS log_activity ON %I', table_name);
        EXECUTE format('CREATE TRIGGER log_activity AFTER INSERT OR UPDATE OR DELETE ON %I 
                       FOR EACH ROW EXECUTE FUNCTION log_table_activity()', table_name);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create triggers
SELECT create_activity_logging_triggers();

-- Log the creation of the triggers
INSERT INTO admin_logs (admin_id, action, entity_type, details)
SELECT 
    id, 
    'create_trigger', 
    'database', 
    'Created activity logging triggers on important tables'
FROM users 
WHERE role = 'admin' 
LIMIT 1;