import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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

// Helper function for single result queries
export async function queryOne<T>(text: string, params: any[] = []): Promise<T | undefined> {
  const result = await query(text, params);
  return result.rows[0] as T;
}

// Helper function for multiple result queries
export async function queryMany<T>(text: string, params: any[] = []): Promise<T[]> {
  const result = await query(text, params);
  return result.rows as T[];
}

// Helper function to run transactions
export async function transaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
