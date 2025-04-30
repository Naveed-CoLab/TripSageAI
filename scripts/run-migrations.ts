import { db, pool, transaction } from '../server/db';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  console.log('Running database migrations...');
  
  try {
    // Check if admin_logs table exists, if not create it
    // This is required for our triggers and stored procedures
    const tableExistsResult = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_logs'
      );
    `);
    
    const tableExists = tableExistsResult[0].exists;
    
    if (!tableExists) {
      console.log('Creating admin_logs table...');
      await db.execute(`
        CREATE TABLE IF NOT EXISTS admin_logs (
          id SERIAL PRIMARY KEY,
          admin_id INTEGER NOT NULL,
          action TEXT NOT NULL,
          entity_type TEXT,
          entity_id INTEGER,
          details TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log('✓ Created admin_logs table');
    }
    
    // Run migrations in a transaction for atomicity
    await transaction(async (client) => {
      // Get all SQL migration files from the migrations directory
      const migrationsDir = path.join(__dirname, '../migrations');
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Sort to ensure correct execution order
      
      // Execute each migration file
      for (const file of migrationFiles) {
        console.log(`Executing migration: ${file}`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        try {
          await client.query(sql);
          console.log(`✓ Successfully executed migration: ${file}`);
        } catch (error) {
          console.error(`Error executing migration ${file}:`, error);
          throw error; // Re-throw to trigger transaction rollback
        }
      }
      
      console.log('All migrations executed successfully');
    }, { name: 'run_migrations', isolation: 'SERIALIZABLE' });
    
    // Check if migrations were successful by testing one of the triggers
    const testTriggerResult = await db.execute(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_timestamp'
      );
    `);
    
    const triggerExists = testTriggerResult[0].exists;
    
    if (triggerExists) {
      console.log('✓ Migrations verified successfully');
    } else {
      console.warn('⚠ Migrations may not have completed successfully - triggers not found');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the migrations when this script is executed directly
if (require.main === module) {
  runMigrations();
}

export default runMigrations;