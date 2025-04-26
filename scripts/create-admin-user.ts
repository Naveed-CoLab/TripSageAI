import { db } from "../server/db";
import { users } from "../shared/schema";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  try {
    console.log("Checking if admin user already exists...");
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.username, "admin"))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("Admin user already exists.");
      // Update the role to make sure it's set to admin
      await db
        .update(users)
        .set({ role: "admin" })
        .where(eq(users.username, "admin"));
      console.log("Updated admin user role to 'admin'.");
      return;
    }

    console.log("Creating admin user...");
    const hashedPassword = await hashPassword("admin123");

    await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
    });

    console.log("Admin user created successfully!");
    console.log("Username: admin");
    console.log("Password: admin123");
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    process.exit(0);
  }
}

createAdminUser();
