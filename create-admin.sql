-- First check if admin user already exists
DO $$
DECLARE
  admin_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM users WHERE username = 'admin') INTO admin_exists;
  
  IF NOT admin_exists THEN
    -- Insert admin user with role 'admin'
    -- Password is 'admin123' hashed (you'll need to provide a real hash)
    -- This is a placeholder hash, we'll update it with a real one
    INSERT INTO users (
      username,
      password,
      email,
      first_name,
      last_name,
      role,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      'admin',
      '11dbb4ba18200e1362e6e9cdcc62222b239f8be4f524d2ddad7e053b77a01e162436e9208f6d4dea83f3a091ce8768028e15177023563a7bdd3ffa6a9ad24d92.126c9250e0be97b45eadc3f756b8890a',
      'admin@tripplanner.com',
      'Site',
      'Administrator',
      'admin',
      true,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Admin user created successfully';
  ELSE
    -- Update existing admin user to ensure role is set to 'admin'
    UPDATE users SET role = 'admin' WHERE username = 'admin';
    RAISE NOTICE 'Admin user already exists, role updated to admin';
  END IF;
END
$$;