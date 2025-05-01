-- Create admin user
INSERT INTO users (username, password, email, role, is_active)
VALUES ('admin', '$2b$10$zXlQUmxRxd9oO.jkl1bzR.wAtS0oWUlg2W5MJp/P4vIZYFIlM1vwi', 'admin@traveladvisor.com', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- Create regular user for testing
INSERT INTO users (username, password, email, role, is_active)
VALUES ('user', '$2b$10$zXlQUmxRxd9oO.jkl1bzR.wAtS0oWUlg2W5MJp/P4vIZYFIlM1vwi', 'user@tripsage.com', 'user', true)
ON CONFLICT (username) DO NOTHING;
