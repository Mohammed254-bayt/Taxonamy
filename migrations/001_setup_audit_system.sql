-- Migration: Setup Audit Logging System
-- This script creates the taxonomy_audit_log table and triggers for all main tables

-- Create the taxonomy_audit_log table
CREATE TABLE IF NOT EXISTS taxonomy_audit_log (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    old_values TEXT,
    new_values TEXT,
    changed_fields TEXT,
    user_id TEXT,
    session_id TEXT,
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
    ip_address TEXT,
    user_agent TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_taxonomy_audit_log_table_record ON taxonomy_audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_taxonomy_audit_log_user_id ON taxonomy_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_taxonomy_audit_log_timestamp ON taxonomy_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_taxonomy_audit_log_operation ON taxonomy_audit_log(operation);

-- Create audit trigger function for occupations
CREATE OR REPLACE FUNCTION audit_occupations_changes()
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

-- Create triggers for occupations table
DROP TRIGGER IF EXISTS occupations_audit_insert ON occupations;
DROP TRIGGER IF EXISTS occupations_audit_update ON occupations;
DROP TRIGGER IF EXISTS occupations_audit_delete ON occupations;

CREATE TRIGGER occupations_audit_insert
    AFTER INSERT ON occupations
    FOR EACH ROW EXECUTE FUNCTION audit_occupations_changes();

CREATE TRIGGER occupations_audit_update
    AFTER UPDATE ON occupations
    FOR EACH ROW EXECUTE FUNCTION audit_occupations_changes();

CREATE TRIGGER occupations_audit_delete
    AFTER DELETE ON occupations
    FOR EACH ROW EXECUTE FUNCTION audit_occupations_changes();

-- Create audit trigger function for synonyms
CREATE OR REPLACE FUNCTION audit_synonyms_changes()
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

-- Create triggers for synonyms table
DROP TRIGGER IF EXISTS synonyms_audit_insert ON synonyms;
DROP TRIGGER IF EXISTS synonyms_audit_update ON synonyms;
DROP TRIGGER IF EXISTS synonyms_audit_delete ON synonyms;

CREATE TRIGGER synonyms_audit_insert
    AFTER INSERT ON synonyms
    FOR EACH ROW EXECUTE FUNCTION audit_synonyms_changes();

CREATE TRIGGER synonyms_audit_update
    AFTER UPDATE ON synonyms
    FOR EACH ROW EXECUTE FUNCTION audit_synonyms_changes();

CREATE TRIGGER synonyms_audit_delete
    AFTER DELETE ON synonyms
    FOR EACH ROW EXECUTE FUNCTION audit_synonyms_changes();

-- Create audit trigger function for taxonomy_sources
CREATE OR REPLACE FUNCTION audit_taxonomy_sources_changes()
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

-- Create triggers for taxonomy_sources table
DROP TRIGGER IF EXISTS taxonomy_sources_audit_insert ON taxonomy_sources;
DROP TRIGGER IF EXISTS taxonomy_sources_audit_update ON taxonomy_sources;
DROP TRIGGER IF EXISTS taxonomy_sources_audit_delete ON taxonomy_sources;

CREATE TRIGGER taxonomy_sources_audit_insert
    AFTER INSERT ON taxonomy_sources
    FOR EACH ROW EXECUTE FUNCTION audit_taxonomy_sources_changes();

CREATE TRIGGER taxonomy_sources_audit_update
    AFTER UPDATE ON taxonomy_sources
    FOR EACH ROW EXECUTE FUNCTION audit_taxonomy_sources_changes();

CREATE TRIGGER taxonomy_sources_audit_delete
    AFTER DELETE ON taxonomy_sources
    FOR EACH ROW EXECUTE FUNCTION audit_taxonomy_sources_changes();

-- Add triggers for other important tables as needed...
-- (Following the same pattern for taxonomy_groups, taxonomy_relationships, etc.)

COMMENT ON TABLE taxonomy_audit_log IS 'Audit log table tracking all changes to monitored tables';
COMMENT ON COLUMN taxonomy_audit_log.table_name IS 'Name of the table that was modified';
COMMENT ON COLUMN taxonomy_audit_log.record_id IS 'ID of the record that was modified';
COMMENT ON COLUMN taxonomy_audit_log.operation IS 'Type of operation: INSERT, UPDATE, or DELETE';
COMMENT ON COLUMN taxonomy_audit_log.old_values IS 'JSON representation of the record before changes (NULL for INSERT)';
COMMENT ON COLUMN taxonomy_audit_log.new_values IS 'JSON representation of the record after changes (NULL for DELETE)';
COMMENT ON COLUMN taxonomy_audit_log.changed_fields IS 'Indicates if fields changed for UPDATE operations (specific changes can be determined by comparing old_values and new_values JSON)';
COMMENT ON COLUMN taxonomy_audit_log.user_id IS 'ID of the user who made the change';
COMMENT ON COLUMN taxonomy_audit_log.session_id IS 'Session ID when the change was made';
COMMENT ON COLUMN taxonomy_audit_log.timestamp IS 'When the change was made';
COMMENT ON COLUMN taxonomy_audit_log.ip_address IS 'IP address of the user who made the change';
COMMENT ON COLUMN taxonomy_audit_log.user_agent IS 'User agent string of the user who made the change'; 