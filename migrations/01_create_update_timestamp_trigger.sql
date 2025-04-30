-- Create a function that updates the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables with updated_at column
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_timestamp ON %I', t_name);
        EXECUTE format('CREATE TRIGGER update_timestamp BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_timestamp()', t_name);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Log the creation of the trigger
INSERT INTO admin_logs (admin_id, action, entity_type, details)
SELECT 
    id, 
    'create_trigger', 
    'database', 
    'Created update_timestamp trigger on multiple tables'
FROM users 
WHERE role = 'admin' 
LIMIT 1;