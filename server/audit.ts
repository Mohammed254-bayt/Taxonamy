import pg from 'pg';
const { Pool } = pg;
type PoolClient = pg.PoolClient;
import { pool } from './db-postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

export interface AuditContext {
  userId: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Auditable Database class that handles audit context automatically
 */
export class AuditableDatabase {
  private client: PoolClient | null = null;
  private db: ReturnType<typeof drizzle> | null = null;
  private isInTransaction = false;

  /**
   * Create a new auditable database instance
   */
  static async create(): Promise<AuditableDatabase> {
    const instance = new AuditableDatabase();
    await instance.initialize();
    return instance;
  }

  /**
   * Initialize the database connection
   */
  private async initialize(): Promise<void> {
    this.client = await pool.connect();
    this.db = drizzle(this.client, { schema });
  }

  /**
   * Set audit context variables for the current session
   */
  private async setAuditContext(auditContext: AuditContext): Promise<void> {
    if (!this.client) throw new Error('Database not initialized');

    console.log('Setting audit context:', {
      userId: auditContext.userId,
      sessionId: auditContext.sessionId,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent?.substring(0, 50) + '...'
    });

    // Set session-local variables that will be available to triggers
    // Note: SET LOCAL doesn't support parameterized queries, so we use string interpolation with escaping
    const escapedUserId = auditContext.userId.replace(/'/g, "''");
    await this.client.query(`SET LOCAL app.current_user_id = '${escapedUserId}'`);
    
    if (auditContext.sessionId) {
      const escapedSessionId = auditContext.sessionId.replace(/'/g, "''");
      await this.client.query(`SET LOCAL app.session_id = '${escapedSessionId}'`);
    }
    
    if (auditContext.ipAddress) {
      const escapedIpAddress = auditContext.ipAddress.replace(/'/g, "''");
      await this.client.query(`SET LOCAL app.ip_address = '${escapedIpAddress}'`);
    }
    
    if (auditContext.userAgent) {
      const escapedUserAgent = auditContext.userAgent.replace(/'/g, "''");
      await this.client.query(`SET LOCAL app.user_agent = '${escapedUserAgent}'`);
    }

    // Verify the variables were set
    try {
      const result = await this.client.query(`
        SELECT 
          current_setting('app.current_user_id', true) as user_id,
          current_setting('app.session_id', true) as session_id,
          current_setting('app.ip_address', true) as ip_address
      `);
      console.log('Audit context verification:', result.rows[0]);
    } catch (error) {
      console.error('Error verifying audit context:', error);
    }
  }

  /**
   * Get the Drizzle database instance
   */
  getDb(): ReturnType<typeof drizzle> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  /**
   * Get the raw PostgreSQL client
   */
  getClient(): PoolClient {
    if (!this.client) throw new Error('Database not initialized');
    return this.client;
  }

  /**
   * Execute a function within a transaction
   */
  async transaction<T>(callback: (db: ReturnType<typeof drizzle>) => Promise<T>, auditContext?: AuditContext): Promise<T> {
    if (!this.client || !this.db) throw new Error('Database not initialized');

    if (this.isInTransaction) {
      // Already in a transaction, just execute the callback
      return callback(this.db);
    }

    try {
      await this.client.query('BEGIN');
      this.isInTransaction = true;
      
      // Set audit context INSIDE the transaction so SET LOCAL variables are accessible
      if (auditContext) {
        await this.setAuditContext(auditContext);
      }
      
      const result = await callback(this.db);
      
      await this.client.query('COMMIT');
      return result;
    } catch (error) {
      await this.client.query('ROLLBACK');
      throw error;
    } finally {
      this.isInTransaction = false;
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.client) {
      this.client.release();
      this.client = null;
      this.db = null;
    }
  }
}

/**
 * Simple function to execute operations with audit context
 * This replaces the old callback-based approach
 */
export async function withAuditContext<T>(
  auditContext: AuditContext | undefined,
  callback: (db: ReturnType<typeof drizzle>) => Promise<T>
): Promise<T> {
  const auditDb = await AuditableDatabase.create();
  
  try {
    return await auditDb.transaction(callback, auditContext);
  } finally {
    await auditDb.close();
  }
}

/**
 * Creates audit log triggers for a specific table
 * @param tableName - Name of the table to audit
 * @returns SQL statements to create the audit triggers
 */
export function createAuditTriggersSQL(tableName: string): string {
  return `
-- Create audit trigger function for ${tableName}
CREATE OR REPLACE FUNCTION audit_${tableName}_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id TEXT;
    v_session_id TEXT;
    v_ip_address TEXT;
    v_user_agent TEXT;
    v_old_values TEXT;
    v_new_values TEXT;
    v_changed_fields TEXT[];
    v_record_id TEXT;
BEGIN
    -- Get session variables (returns empty string if not set, NULL causes issues)
    v_user_id := COALESCE(current_setting('app.current_user_id', true), '');
    v_session_id := COALESCE(current_setting('app.session_id', true), '');
    v_ip_address := COALESCE(current_setting('app.ip_address', true), '');
    v_user_agent := COALESCE(current_setting('app.user_agent', true), '');
    
    -- Determine record ID and build JSON representations
    IF TG_OP = 'DELETE' THEN
        v_record_id := OLD.id::TEXT;
        v_old_values := row_to_json(OLD)::TEXT;
        v_new_values := NULL;
        v_changed_fields := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        v_record_id := NEW.id::TEXT;
        v_old_values := row_to_json(OLD)::TEXT;
        v_new_values := row_to_json(NEW)::TEXT;
        
        -- Find changed fields by comparing JSON representations
        v_changed_fields := ARRAY[]::TEXT[];
        IF v_old_values != v_new_values THEN
            -- For simplicity, we'll mark that fields changed but not specify which ones
            -- The application can parse old_values and new_values JSON to determine specific changes
            v_changed_fields := ARRAY['multiple_fields']::TEXT[];
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        v_record_id := NEW.id::TEXT;
        v_old_values := NULL;
        v_new_values := row_to_json(NEW)::TEXT;
        v_changed_fields := NULL;
    END IF;
    
    -- Insert audit log entry
    INSERT INTO taxonomy_audit_log (
        table_name,
        record_id,
        operation,
        old_values,
        new_values,
        changed_fields,
        user_id,
        session_id,
        ip_address,
        user_agent
    ) VALUES (
        TG_TABLE_NAME,
        v_record_id,
        TG_OP,
        v_old_values,
        v_new_values,
        array_to_json(v_changed_fields)::TEXT,
        NULLIF(v_user_id, ''),
        NULLIF(v_session_id, ''),
        NULLIF(v_ip_address, ''),
        NULLIF(v_user_agent, '')
    );
    
    -- Return appropriate row based on operation
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS ${tableName}_audit_insert ON ${tableName};
DROP TRIGGER IF EXISTS ${tableName}_audit_update ON ${tableName};
DROP TRIGGER IF EXISTS ${tableName}_audit_delete ON ${tableName};

-- Create triggers for INSERT, UPDATE, and DELETE operations
CREATE TRIGGER ${tableName}_audit_insert
    AFTER INSERT ON ${tableName}
    FOR EACH ROW EXECUTE FUNCTION audit_${tableName}_changes();

CREATE TRIGGER ${tableName}_audit_update
    AFTER UPDATE ON ${tableName}
    FOR EACH ROW EXECUTE FUNCTION audit_${tableName}_changes();

CREATE TRIGGER ${tableName}_audit_delete
    AFTER DELETE ON ${tableName}
    FOR EACH ROW EXECUTE FUNCTION audit_${tableName}_changes();
`;
}

/**
 * Generates SQL to create audit triggers for all main tables
 */
export const createAllAuditTriggersSQL = (): string => {
  const tables = [
    'occupations',
    'synonyms',
    'taxonomy_sources',
    'taxonomy_groups',
    'taxonomy_relationships',
    'synonym_source_mapping',
    'synonym_relationships',
    'occupation_synonyms',
    'occupation_source_mapping',
    'occupation_taxonomy_mapping'
  ];
  
  let sql = `
-- Audit logging setup (no extensions required)

`;
  
  tables.forEach(table => {
    sql += createAuditTriggersSQL(table) + '\n\n';
  });
  
  return sql;
};

/**
 * Helper function to execute raw SQL with proper error handling
 */
export async function executeSQLScript(sqlScript: string): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query(sqlScript);
  } finally {
    client.release();
  }
}

/**
 * Initialize audit logging system by creating all necessary triggers
 */
export async function initializeAuditSystem(): Promise<void> {
  const sql = createAllAuditTriggersSQL();
  await executeSQLScript(sql);
}

