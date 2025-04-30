import { db, pool, transaction, query } from '../server/db';
import { databaseMetadata } from '../shared/schema';

/**
 * This script tests the PostgreSQL features we've implemented:
 * 1. Trigger functionality
 * 2. Stored procedure calls
 * 3. Transactions with different isolation levels
 */

// Test the update_timestamp trigger
async function testUpdateTimestampTrigger() {
  console.log('\n--- Testing update_timestamp trigger ---');
  
  try {
    // First, let's create a test user
    const insertResult = await query(`
      INSERT INTO users (username, password, email, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at, updated_at
    `, ['testuser_trigger', 'password123', 'testtrigger@example.com', 'user']);
    
    const userId = insertResult.rows[0].id;
    const createdAt = insertResult.rows[0].created_at;
    const updatedAt = insertResult.rows[0].updated_at;
    
    console.log(`Created test user with ID ${userId}`);
    console.log(`Initial created_at: ${createdAt}`);
    console.log(`Initial updated_at: ${updatedAt}`);
    
    // Wait a moment to ensure timestamps will be different
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Now update the user to trigger the update_timestamp trigger
    await query(`
      UPDATE users
      SET first_name = $1
      WHERE id = $2
    `, ['Trigger', userId]);
    
    // Check if updated_at was automatically updated
    const checkResult = await query(`
      SELECT created_at, updated_at
      FROM users
      WHERE id = $1
    `, [userId]);
    
    const newCreatedAt = checkResult.rows[0].created_at;
    const newUpdatedAt = checkResult.rows[0].updated_at;
    
    console.log(`After update created_at: ${newCreatedAt}`);
    console.log(`After update updated_at: ${newUpdatedAt}`);
    
    // Clean up - delete the test user
    await query(`DELETE FROM users WHERE id = $1`, [userId]);
    
    // Verify the result
    if (newCreatedAt.toString() === newUpdatedAt.toString()) {
      console.log('❌ Test failed: updated_at did not change');
      return false;
    } else {
      console.log('✅ Test passed: updated_at was automatically updated by the trigger');
      return true;
    }
  } catch (error) {
    console.error('Error testing update_timestamp trigger:', error);
    return false;
  }
}

// Test the log_activity trigger
async function testLogActivityTrigger() {
  console.log('\n--- Testing log_activity trigger ---');
  
  try {
    // First, let's create a test user
    const insertResult = await query(`
      INSERT INTO users (username, password, email, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, ['testuser_log', 'password123', 'testlog@example.com', 'user']);
    
    const userId = insertResult.rows[0].id;
    console.log(`Created test user with ID ${userId}`);
    
    // Now check if an entry was created in the analytics table
    const analyticsResult = await query(`
      SELECT id, event_type, user_id
      FROM analytics
      WHERE event_type = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, ['create_users']);
    
    if (analyticsResult.rows.length > 0) {
      console.log(`Found analytics entry: ${JSON.stringify(analyticsResult.rows[0])}`);
    } else {
      console.log('No analytics entry found');
    }
    
    // Also check the admin_logs table
    const logsResult = await query(`
      SELECT id, action, entity_type, entity_id
      FROM admin_logs
      WHERE entity_type = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, ['users']);
    
    if (logsResult.rows.length > 0) {
      console.log(`Found admin_logs entry: ${JSON.stringify(logsResult.rows[0])}`);
    } else {
      console.log('No admin_logs entry found');
    }
    
    // Clean up - delete the test user
    await query(`DELETE FROM users WHERE id = $1`, [userId]);
    
    // Determine test result
    const success = analyticsResult.rows.length > 0 || logsResult.rows.length > 0;
    if (success) {
      console.log('✅ Test passed: Activity was logged by the trigger');
    } else {
      console.log('❌ Test failed: No activity logging detected');
    }
    
    return success;
  } catch (error) {
    console.error('Error testing log_activity trigger:', error);
    return false;
  }
}

// Test the register_user stored procedure
async function testRegisterUserProcedure() {
  console.log('\n--- Testing register_user stored procedure ---');
  
  try {
    // Call the stored procedure
    await query(`
      CALL register_user($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      'testproc_user',
      'testproc@example.com',
      'password123',
      'Proc',
      'Test',
      null,
      'Test user created via stored procedure',
      '+1234567890'
    ]);
    
    // Check if the user was created
    const userResult = await query(`
      SELECT id, username, email, first_name, last_name
      FROM users
      WHERE username = $1
    `, ['testproc_user']);
    
    if (userResult.rows.length > 0) {
      console.log(`Created user: ${JSON.stringify(userResult.rows[0])}`);
      
      // Check if user settings were also created
      const userId = userResult.rows[0].id;
      const settingsResult = await query(`
        SELECT id, user_id, theme, language
        FROM user_settings
        WHERE user_id = $1
      `, [userId]);
      
      if (settingsResult.rows.length > 0) {
        console.log(`Created user settings: ${JSON.stringify(settingsResult.rows[0])}`);
      } else {
        console.log('No user settings found');
      }
      
      // Clean up - delete the test user
      await query(`DELETE FROM user_settings WHERE user_id = $1`, [userId]);
      await query(`DELETE FROM users WHERE id = $1`, [userId]);
      
      // Determine test result
      const success = settingsResult.rows.length > 0;
      if (success) {
        console.log('✅ Test passed: User and settings created by the stored procedure');
      } else {
        console.log('❌ Test failed: User created but settings missing');
      }
      
      return success;
    } else {
      console.log('❌ Test failed: No user created by the stored procedure');
      return false;
    }
  } catch (error) {
    console.error('Error testing register_user procedure:', error);
    return false;
  }
}

// Test transaction with different isolation levels
async function testTransactionIsolationLevels() {
  console.log('\n--- Testing transaction isolation levels ---');
  
  const isolationLevels = databaseMetadata.transactionIsolationLevels.map(level => level.name);
  const results: Record<string, boolean> = {};
  
  for (const isolationLevel of isolationLevels) {
    console.log(`\nTesting isolation level: ${isolationLevel}`);
    
    try {
      await transaction(async (client) => {
        // Execute a query inside the transaction
        const result = await client.query(`
          SELECT 'Testing transaction with isolation level ${isolationLevel}' as test
        `);
        console.log(`Query result: ${result.rows[0].test}`);
        
        // We could test specific isolation behaviors here in a more complex example
        // For now, we'll just verify that the transaction completes successfully
      }, { name: `test_isolation_${isolationLevel.replace(' ', '_')}`, isolation: isolationLevel as any });
      
      console.log(`✅ Transaction with isolation level ${isolationLevel} completed successfully`);
      results[isolationLevel] = true;
    } catch (error) {
      console.error(`Error in transaction with isolation level ${isolationLevel}:`, error);
      results[isolationLevel] = false;
    }
  }
  
  // Report results
  console.log('\nTransaction isolation level test results:');
  let allPassed = true;
  for (const level in results) {
    console.log(`${level}: ${results[level] ? '✅ Passed' : '❌ Failed'}`);
    if (!results[level]) allPassed = false;
  }
  
  return allPassed;
}

// Run all tests
async function runTests() {
  console.log('=== Testing PostgreSQL Features ===');
  
  try {
    const results = {
      updateTimestampTrigger: await testUpdateTimestampTrigger(),
      logActivityTrigger: await testLogActivityTrigger(),
      registerUserProcedure: await testRegisterUserProcedure(),
      transactionIsolationLevels: await testTransactionIsolationLevels()
    };
    
    console.log('\n=== Test Results Summary ===');
    let allPassed = true;
    for (const test in results) {
      console.log(`${test}: ${results[test as keyof typeof results] ? '✅ Passed' : '❌ Failed'}`);
      if (!results[test as keyof typeof results]) allPassed = false;
    }
    
    if (allPassed) {
      console.log('\n🎉 All PostgreSQL features are working correctly!');
    } else {
      console.log('\n⚠️ Some PostgreSQL features are not working correctly.');
    }
  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the tests when this script is executed directly
if (require.main === module) {
  runTests();
}

export default runTests;