import { pool } from "../server/db";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  try {
    console.log("Checking if admin user already exists...");
    
    // Check if admin already exists
    const existingUserQuery = await pool.query(
      "SELECT * FROM users WHERE username = 'admin'"
    );
    
    if (existingUserQuery.rows.length > 0) {
      console.log("Admin user already exists");
      return;
    }
    
    console.log("Creating admin user...");
    
    // Hash password
    const hashedPassword = await hashPassword("admin123");
    
    // Insert admin user
    const insertUserQuery = `
      INSERT INTO users (
        username, password, email, first_name, last_name, role, is_active
      ) VALUES (
        'admin', $1, 'admin@travelapp.com', 'Admin', 'User', 'admin', true
      ) RETURNING id
    `;
    
    const userResult = await pool.query(insertUserQuery, [hashedPassword]);
    const userId = userResult.rows[0].id;
    
    // Create user settings for admin
    const insertSettingsQuery = `
      INSERT INTO user_settings (
        user_id, theme, language, email_notifications, push_notifications
      ) VALUES (
        $1, 'dark', 'en', true, true
      )
    `;
    
    await pool.query(insertSettingsQuery, [userId]);
    
    console.log("Admin user created successfully with ID:", userId);
    console.log("Username: admin");
    console.log("Password: admin123");
    
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await pool.end();
  }
}

createAdminUser();