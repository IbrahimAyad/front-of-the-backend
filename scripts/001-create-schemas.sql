-- Multi-Schema Database Architecture - Phase 1: Schema Creation
-- This script creates the schemas needed for multi-tenant architecture
-- Run this after backing up your database

-- Create schemas
CREATE SCHEMA IF NOT EXISTS tenant_shared;
CREATE SCHEMA IF NOT EXISTS tenant_kct;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS cache;
CREATE SCHEMA IF NOT EXISTS audit;

-- Grant permissions (adjust role names as needed)
-- Replace 'kct_app' with your actual application role
GRANT ALL ON SCHEMA tenant_shared TO current_user;
GRANT ALL ON SCHEMA tenant_kct TO current_user;
GRANT ALL ON SCHEMA analytics TO current_user;
GRANT ALL ON SCHEMA cache TO current_user;
GRANT ALL ON SCHEMA audit TO current_user;

-- Create audit log table in audit schema
CREATE TABLE IF NOT EXISTS audit.change_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    record_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
    changed_by VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    old_values JSONB,
    new_values JSONB,
    schema_name VARCHAR(255) NOT NULL
);

-- Create index for audit log queries
CREATE INDEX idx_audit_log_table_record ON audit.change_log(table_name, record_id);
CREATE INDEX idx_audit_log_timestamp ON audit.change_log(changed_at DESC);

-- Create a function to track future schema changes
CREATE OR REPLACE FUNCTION audit.log_schema_change()
RETURNS event_trigger AS $$
DECLARE
    obj record;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
    LOOP
        INSERT INTO audit.change_log (
            table_name,
            record_id,
            action,
            changed_by,
            new_values,
            schema_name
        ) VALUES (
            obj.object_identity,
            obj.object_identity,
            obj.command_tag,
            current_user,
            row_to_json(obj)::jsonb,
            obj.schema_name
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create event trigger for DDL changes (optional - remove if not needed)
-- CREATE EVENT TRIGGER log_ddl_changes ON ddl_command_end
-- EXECUTE FUNCTION audit.log_schema_change();

-- Verify schemas were created
SELECT schema_name, schema_owner 
FROM information_schema.schemata 
WHERE schema_name IN ('tenant_shared', 'tenant_kct', 'analytics', 'cache', 'audit')
ORDER BY schema_name;