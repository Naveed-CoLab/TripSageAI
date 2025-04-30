import { db, pool, transaction, query } from '../server/db';
import fs from 'fs';
import path from 'path';
import runMigrations from './run-migrations';

/**
 * This script sets up advanced PostgreSQL features:
 * 1. Runs all migrations to create triggers, stored procedures
 * 2. Verifies that triggers and stored procedures are created correctly
 * 3. Sets up detailed database logging
 */

// Verify a specific trigger exists in the database
async function checkTriggerExists(triggerName: string): Promise<boolean> {
  const result = await query(`
    SELECT EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgname = $1
    );
  `, [triggerName]);
  
  return result.rows[0].exists;
}

// Verify a stored procedure exists in the database
async function checkProcedureExists(procedureName: string): Promise<boolean> {
  const result = await query(`
    SELECT EXISTS (
      SELECT 1
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      AND p.proname = $1
    );
  `, [procedureName]);
  
  return result.rows[0].exists;
}

// Sample transaction to test transaction functionality
async function testTransaction(): Promise<void> {
  try {
    await transaction(async (client) => {
      // Inside transaction
      await client.query(`
        SELECT 'Testing transaction functionality' as test;
      `);
      
      // Would actually do something meaningful in a real app
      console.log('✓ Transaction tested successfully');
    }, { name: 'test_transaction', isolation: 'SERIALIZABLE' });
  } catch (error) {
    console.error('Transaction test failed:', error);
    throw error;
  }
}

// Main setup function
async function setupPostgresFeatures() {
  console.log('Setting up advanced PostgreSQL features...');
  
  try {
    // 1. Run migrations first (this will create triggers and stored procedures)
    await runMigrations();
    
    // 2. Verify that triggers were created
    const updateTimestampExists = await checkTriggerExists('update_timestamp');
    const logActivityExists = await checkTriggerExists('log_activity');
    
    if (updateTimestampExists) {
      console.log('✓ update_timestamp trigger exists');
    } else {
      console.error('⚠ update_timestamp trigger was not created');
    }
    
    if (logActivityExists) {
      console.log('✓ log_activity trigger exists');
    } else {
      console.error('⚠ log_activity trigger was not created');
    }
    
    // 3. Verify that stored procedures were created
    const createTripExists = await checkProcedureExists('create_trip');
    const registerUserExists = await checkProcedureExists('register_user');
    const processBookingApprovalExists = await checkProcedureExists('process_booking_approval');
    
    if (createTripExists) {
      console.log('✓ create_trip stored procedure exists');
    } else {
      console.error('⚠ create_trip stored procedure was not created');
    }
    
    if (registerUserExists) {
      console.log('✓ register_user stored procedure exists');
    } else {
      console.error('⚠ register_user stored procedure was not created');
    }
    
    if (processBookingApprovalExists) {
      console.log('✓ process_booking_approval stored procedure exists');
    } else {
      console.error('⚠ process_booking_approval stored procedure was not created');
    }
    
    // 4. Test transaction functionality
    await testTransaction();
    
    // 5. Set up detailed database logging (configure PostgreSQL to log queries)
    await query(`
      ALTER SYSTEM SET log_statement = 'all';
      ALTER SYSTEM SET log_min_duration_statement = 100; -- Log queries that take more than 100ms
      SELECT pg_reload_conf(); -- Reload configuration
    `);
    
    console.log('✓ Set up detailed database logging');
    
    console.log('Advanced PostgreSQL features setup completed successfully!');
    
  } catch (error) {
    console.error('Setup of PostgreSQL features failed:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the setup when this script is executed directly
if (require.main === module) {
  setupPostgresFeatures();
}

export default setupPostgresFeatures;