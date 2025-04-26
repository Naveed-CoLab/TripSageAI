import { pool, query } from "../server/db";
import { randomBytes, scrypt } from "crypto";
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
    
    const checkUserSQL = `
      SELECT id, username, role FROM users
      WHERE username = $1
      LIMIT 1
    `;
    
    const existingAdmin = await query(checkUserSQL, ["admin"]);

    if (existingAdmin.rows.length > 0) {
      console.log("Admin user already exists.");
      // Update the role to make sure it's set to admin
      const updateRoleSQL = `
        UPDATE users
        SET role = 'admin'
        WHERE username = $1
        RETURNING id, username, role
      `;
      
      await query(updateRoleSQL, ["admin"]);
      console.log("Updated admin user role to 'admin'.");
      return;
    }

    console.log("Creating admin user...");
    const hashedPassword = await hashPassword("admin123");

    const insertUserSQL = `
      INSERT INTO users (
        username, password, email, first_name, last_name, role, is_active, created_at, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
      )
      RETURNING id, username, email, role
    `;
    
    const values = [
      "admin",
      hashedPassword,
      "admin@example.com",
      "Admin",
      "User",
      "admin",
      true
    ];
    
    await query(insertUserSQL, values);

    console.log("Admin user created successfully!");
    console.log("Username: admin");
    console.log("Password: admin123");
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    pool.end();
    process.exit(0);
  }
}

createAdminUser();
