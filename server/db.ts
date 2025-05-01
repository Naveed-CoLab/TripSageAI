import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
// No need for drizzle-orm import since we're using raw SQL

// Configure neon to use WebSockets for the serverless environment
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a pool of connections to PostgreSQL for better performance
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
});

// Helper function to run parameterized queries safely (prevents SQL injection)
export async function query(text: string, params: any[] = []) {
  try {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
}

// Helper function to run transactions with improved logging and error handling
export async function transaction<T>(
  callback: (client: any) => Promise<T>,
  options: { name?: string; isolation?: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE' } = {}
): Promise<T> {
  const transactionName = options.name || `tx_${Date.now()}`;
  const isolationLevel = options.isolation || 'READ COMMITTED';
  const client = await pool.connect();
  const startTime = Date.now();
  
  try {
    console.log(`Starting transaction '${transactionName}' with isolation level ${isolationLevel}`);
    await client.query('BEGIN');
    
    // Set the isolation level
    await client.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    const duration = Date.now() - startTime;
    console.log(`Transaction '${transactionName}' committed successfully in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Transaction '${transactionName}' failed after ${duration}ms with error:`, error);
    
    try {
      await client.query('ROLLBACK');
      console.log(`Transaction '${transactionName}' rolled back successfully`);
    } catch (rollbackError) {
      console.error(`Failed to rollback transaction '${transactionName}':`, rollbackError);
    }
    
    // If this is a database constraint error, provide a more user-friendly message
    if (error instanceof Error) {
      const pgError = error as any;
      if (pgError.code) {
        // Map common PostgreSQL error codes to user-friendly messages
        const errorMessages: Record<string, string> = {
          '23505': 'A record with this information already exists.',
          '23503': 'This action references a record that does not exist.',
          '23502': 'A required field is missing.',
          '23514': 'The provided data does not meet the validation requirements.'
        };
        
        if (errorMessages[pgError.code]) {
          const enhancedError = new Error(
            `${errorMessages[pgError.code]} (Detail: ${pgError.detail || 'No additional details'})`
          );
          throw enhancedError;
        }
      }
    }
    
    throw error;
  } finally {
    client.release();
  }
}
