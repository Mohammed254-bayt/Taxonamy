# Audit Logging System

This document describes the comprehensive audit logging system implemented for the taxonomy management application.

## Overview

The audit logging system automatically tracks all changes to database records using PostgreSQL triggers and session-local variables. It captures:

- **What changed**: Complete before/after values (specific field changes can be determined by comparing the JSON)
- **Who made the change**: User ID from session context
- **When it happened**: Timestamp of the operation
- **How it happened**: Operation type (INSERT, UPDATE, DELETE)
- **Where it came from**: IP address, user agent, session ID

## Key Features

- **Session-local variables**: Uses `SET LOCAL` to avoid affecting global session state
- **Transaction-scoped**: Context is automatically cleared when transaction ends
- **Automatic triggers**: No need to manually add audit calls to your code
- **Complete change tracking**: Stores full JSON before/after values and changed fields
- **Non-blocking**: Audit failures don't prevent the original operation

## Database Schema

### Audit Log Table

```sql
CREATE TABLE taxonomy_audit_log (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,           -- Name of the affected table
    record_id TEXT NOT NULL,            -- ID of the affected record
    operation TEXT NOT NULL,            -- INSERT, UPDATE, DELETE
    old_values TEXT,                    -- JSON of record before change (NULL for INSERT)
    new_values TEXT,                    -- JSON of record after change (NULL for DELETE)
    changed_fields TEXT,                -- Indicates if fields changed (UPDATE only)
    user_id TEXT,                       -- User who made the change
    session_id TEXT,                    -- Session identifier
    timestamp TIMESTAMP DEFAULT NOW(), -- When the change occurred
    ip_address TEXT,                    -- IP address of the user
    user_agent TEXT                     -- Browser/client information
);
```

### Indexes

The following indexes are created for optimal query performance:

```sql
CREATE INDEX idx_taxonomy_audit_log_table_record ON taxonomy_audit_log(table_name, record_id);
CREATE INDEX idx_taxonomy_audit_log_user_id ON taxonomy_audit_log(user_id);
CREATE INDEX idx_taxonomy_audit_log_timestamp ON taxonomy_audit_log(timestamp);
CREATE INDEX idx_taxonomy_audit_log_operation ON taxonomy_audit_log(operation);
```

## Usage

### Basic Usage with `withUserContext`

The main function for using the audit system is `withUserContext`:

```typescript
import { withUserContext } from './server/audit';

async function createOccupation(userId: string, data: any) {
  await withUserContext(userId, async (client) => {
    // All database operations within this callback will be audited
    // with the specified user context
    
    const result = await client.query(
      'INSERT INTO occupations (preferred_label_en, definition) VALUES ($1, $2) RETURNING id',
      [data.preferredLabelEn, data.definition]
    );
    
    console.log('Created occupation:', result.rows[0].id);
  });
}
```

### With Additional Context

You can provide additional context like session ID, IP address, and user agent:

```typescript
await withUserContext(userId, async (client) => {
  // Your database operations here
}, {
  sessionId: req.sessionID,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
});
```

### Express Route Example

```typescript
app.post('/api/occupations', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const requestContext = {
      sessionId: req.sessionID,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };
    
    await withUserContext(userId, async (client) => {
      const result = await client.query(
        'INSERT INTO occupations (preferred_label_en, definition) VALUES ($1, $2) RETURNING id',
        [req.body.preferredLabelEn, req.body.definition]
      );
      
      res.json({ success: true, id: result.rows[0].id });
    }, requestContext);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## How It Works

### 1. Session Variables

When you call `withUserContext`, it sets PostgreSQL session-local variables:

```sql
SET LOCAL app.current_user_id = 'user123';
SET LOCAL app.session_id = 'session456';
SET LOCAL app.ip_address = '192.168.1.1';
SET LOCAL app.user_agent = 'Mozilla/5.0...';
```

These variables are automatically cleared when the transaction ends.

### 2. Database Triggers

Each monitored table has triggers that:

1. **Capture the operation**: INSERT, UPDATE, or DELETE
2. **Read session variables**: Get user context from session-local variables
3. **Compare values**: For UPDATEs, identify which fields changed
4. **Store audit record**: Insert complete audit trail

Example trigger code:

```sql
CREATE TRIGGER occupations_audit_insert
    AFTER INSERT ON occupations
    FOR EACH ROW EXECUTE FUNCTION audit_occupations_changes();
```

### 3. Trigger Function

The trigger function:

```sql
-- Get session variables
v_user_id := COALESCE(current_setting('app.current_user_id', true), '');

-- Build JSON representations
v_old_values := row_to_json(OLD)::TEXT;
v_new_values := row_to_json(NEW)::TEXT;

-- Insert audit record
INSERT INTO taxonomy_audit_log (...) VALUES (...);
```

## Querying Audit Logs

### Get all changes for a specific record:

```typescript
import { getAuditLogsForRecord } from './server/audit-examples';

const logs = await getAuditLogsForRecord('occupations', '123');
```

### Get all changes by a specific user:

```typescript
import { getAuditLogsByUser } from './server/audit-examples';

const logs = await getAuditLogsByUser('user123');
```

### Custom queries:

```typescript
import { db } from './server/db-postgres';
import { auditLog } from '@shared/schema';
import { eq, and, gte } from 'drizzle-orm';

// Get recent changes to occupations
const recentChanges = await db
  .select()
  .from(auditLog)
  .where(and(
    eq(auditLog.tableName, 'occupations'),
    gte(auditLog.timestamp, new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
  ))
  .orderBy(desc(auditLog.timestamp));
```

## Setup and Installation

### 1. Run the Migration

Execute the migration script to create the audit tables and triggers:

```bash
psql -d your_database -f migrations/001_setup_audit_system.sql
```

Or programmatically:

```typescript
import { initializeAuditSystem } from './server/audit';

await initializeAuditSystem();
```

### 2. Update Your Schema

The audit log table is already included in `shared/schema.ts`. Run your schema migrations to ensure it's created.

### 3. Start Using

Import and use `withUserContext` in your application code.

## Performance Considerations

- **Minimal overhead**: Triggers are lightweight and fast
- **Indexed properly**: Key fields are indexed for fast queries
- **JSON storage**: Using TEXT fields for JSON to maintain compatibility
- **Async logging**: Audit records are written in the same transaction but don't block the main operation
- **No extensions required**: Works with standard PostgreSQL without additional extensions

## Security Features

- **Session isolation**: Uses `SET LOCAL` so context doesn't leak between sessions
- **Transaction scope**: Context automatically cleared when transaction ends
- **No global state**: Each transaction has its own context
- **SQL injection safe**: All parameters are properly escaped

## Monitored Tables

Currently configured to audit:

- `occupations`
- `synonyms`  
- `taxonomy_sources`
- Additional tables can be added using the same pattern

## Best Practices

1. **Always use `withUserContext`** for operations that should be audited
2. **Include request context** when available (IP, user agent, session)
3. **Handle errors gracefully** - audit failures shouldn't break your app
4. **Regular cleanup** - Consider archiving old audit logs periodically
5. **Monitor performance** - Keep an eye on audit log table size

## Extending the System

### Adding New Tables

To add audit logging to a new table:

1. **Add trigger function** (or use the generic one)
2. **Create triggers** for INSERT, UPDATE, DELETE
3. **Test thoroughly** to ensure it works correctly

Example:

```sql
-- Add triggers for new_table
CREATE TRIGGER new_table_audit_insert
    AFTER INSERT ON new_table
    FOR EACH ROW EXECUTE FUNCTION audit_new_table_changes();
```

### Custom Audit Logic

You can extend the trigger functions to include custom logic:

- **Sensitive data filtering**: Exclude certain fields from audit logs
- **Conditional logging**: Only log certain types of changes
- **Additional context**: Include business-specific information

## Troubleshooting

### No User Context in Logs

**Problem**: `user_id` is NULL in audit logs

**Solution**: Ensure you're using `withUserContext` wrapper for all audited operations

### Performance Issues

**Problem**: Slow queries on audit logs

**Solution**: 
- Check indexes are created
- Consider partitioning by date
- Archive old records

### Missing Audit Records

**Problem**: Expected audit records not appearing

**Solution**:
- Verify triggers are installed: `\dt+ table_name` in psql
- Check for trigger errors in PostgreSQL logs
- Ensure operations are within `withUserContext`

## Advanced Features

### Audit Log Retention

Consider implementing a retention policy:

```sql
-- Delete audit logs older than 2 years
DELETE FROM taxonomy_audit_log 
WHERE timestamp < NOW() - INTERVAL '2 years';
```

### Data Anonymization

For compliance, you might want to anonymize old audit logs:

```sql
-- Anonymize user data in old audit logs
UPDATE taxonomy_audit_log 
SET user_id = 'ANONYMIZED', 
    ip_address = NULL,
    user_agent = NULL
WHERE timestamp < NOW() - INTERVAL '1 year';
```

This audit logging system provides comprehensive tracking of all database changes while maintaining excellent performance and security. 