import 'dotenv/config';
import { pool } from '../server/db.js';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64));
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const checkResult = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
    
    if (checkResult.rows.length > 0) {
      console.log('Admin user already exists!');
      return;
    }
    
    // Create admin user
    const hashedPassword = await hashPassword('admin123');
    
    const result = await pool.query(
      `INSERT INTO users (
        username, 
        password, 
        email, 
        first_name, 
        last_name, 
        role
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        'admin',
        hashedPassword,
        'admin@tripplanner.com',
        'Site',
        'Administrator',
        'admin'
      ]
    );
    
    console.log('Admin user created successfully:', result.rows[0]);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

createAdminUser().catch(console.error);