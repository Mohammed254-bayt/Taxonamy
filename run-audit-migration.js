import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

// Database connection (update this to your database if needed)
const DATABASE_URL = 'postgresql://baytpg:casi02@192.168.6.7:9988/baytpg';

const pool = new Pool({ 
  connectionString: DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

async function runAuditMigration() {
  console.log('🚀 Running audit system migration...');
  
  try {
    const client = await pool.connect();
    
    console.log('📋 Step 1: Reading migration file...');
    
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'migrations', '001_setup_audit_system.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded successfully');
    console.log(`   File size: ${migrationSQL.length} characters`);
    
    console.log('📋 Step 2: Checking database connection...');
    const versionResult = await client.query('SELECT version()');
    console.log('✅ Connected to:', versionResult.rows[0].version.split(' ').slice(0, 2).join(' '));
    
    console.log('📋 Step 3: Executing migration...');
    
    try {
      // Execute the entire migration as one transaction
      // This is the standard approach for SQL migration files
      await client.query('BEGIN');
      console.log('   📦 Started transaction');
      
      await client.query(migrationSQL);
      console.log('   ✅ Migration SQL executed successfully');
      
      await client.query('COMMIT');
      console.log('   ✅ Transaction committed');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.log('   ❌ Transaction rolled back');
      throw error;
    }

    console.log('📋 Step 4: Verifying audit system...');
    
    // Check if taxonomy_audit_log table exists
    const auditTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'taxonomy_audit_log'
      ) as table_exists
    `);
    
    if (auditTableCheck.rows[0].table_exists) {
      console.log('✅ taxonomy_audit_log table created successfully');
      
      // Check table structure
      const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'taxonomy_audit_log'
        ORDER BY ordinal_position
      `);
      
      console.log('✅ Taxonomy audit log columns:');
      columnsResult.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log('⚠️  taxonomy_audit_log table was not created');
    }

    // Check if audit functions exist
    const functionsResult = await client.query(`
      SELECT proname 
      FROM pg_proc 
      WHERE proname LIKE 'audit_%_changes'
      ORDER BY proname
    `);
    
    if (functionsResult.rows.length > 0) {
      console.log('✅ Audit functions created:');
      functionsResult.rows.forEach(row => {
        console.log(`   - ${row.proname}()`);
      });
    } else {
      console.log('⚠️  No audit functions found');
    }
    
    // Check if triggers exist
    const triggersResult = await client.query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      AND trigger_name LIKE '%audit%'
      ORDER BY event_object_table, trigger_name
    `);
    
    if (triggersResult.rows.length > 0) {
      console.log('✅ Audit triggers created:');
      triggersResult.rows.forEach(row => {
        console.log(`   - ${row.trigger_name} on ${row.event_object_table}`);
      });
    } else {
      console.log('⚠️  No audit triggers found');
    }
    
    client.release();
    
    console.log('\n🎉 Taxonomy audit system migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start the application: docker-compose up --build');
    console.log('   2. Test the audit functionality by making changes to occupations, synonyms, or taxonomy sources');
    console.log('   3. View audit logs: Check the taxonomy_audit_log table or use the audit logs page in the application');
    
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('   1. Check if the user has CREATE privileges');
    console.error('   2. Verify the migration file exists');
    console.error('   3. Check if the target tables (occupations, synonyms, taxonomy_sources) exist');
    console.error('   4. Review the error message above for specific SQL syntax issues');
    return false;
  } finally {
    await pool.end();
  }
}

// Add command line options
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log(`
📖 Taxonomy Audit System Migration Runner

Usage: node run-audit-migration.js [options]

Options:
  --help, -h     Show this help message

Description:
  This script runs the 001_setup_audit_system.sql migration file to set up
  the taxonomy audit logging system. It will:
  
  1. Create the taxonomy_audit_log table
  2. Create audit trigger functions  
  3. Create triggers for occupations, synonyms, and taxonomy_sources tables
  4. Create necessary indexes
  5. Verify the setup

Database: ${DATABASE_URL.replace(/:([^:@]*@)/, ':****@')}

Requirements:
  - PostgreSQL database must be accessible
  - User must have CREATE privileges
  - Target tables (occupations, synonyms, taxonomy_sources) should exist
`);
  process.exit(0);
}

// Run migration
console.log('Starting taxonomy audit system migration...');
console.log('Database:', DATABASE_URL.replace(/:([^:@]*@)/, ':****@'));

runAuditMigration()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  }); 