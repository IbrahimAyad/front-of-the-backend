#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)
const prisma = new PrismaClient()

interface MigrationStep {
  name: string
  description: string
  execute: () => Promise<void>
  rollback?: () => Promise<void>
}

class MultiSchemaMigration {
  private steps: MigrationStep[] = []
  private completedSteps: string[] = []

  constructor() {
    this.setupSteps()
  }

  private setupSteps() {
    this.steps = [
      {
        name: 'backup_database',
        description: 'Creating database backup',
        execute: async () => {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const backupFile = `backup-before-schema-migration-${timestamp}.sql`
          
          console.log(`Creating backup: ${backupFile}`)
          
          if (process.env.DATABASE_URL) {
            await execAsync(`pg_dump ${process.env.DATABASE_URL} > ${backupFile}`)
            console.log(`✅ Backup created: ${backupFile}`)
          } else {
            throw new Error('DATABASE_URL not set')
          }
        }
      },
      {
        name: 'create_schemas',
        description: 'Creating new schemas',
        execute: async () => {
          await prisma.$transaction([
            prisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS tenant_shared`,
            prisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS tenant_kct`,
            prisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS analytics`,
            prisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS cache`,
            prisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS audit`
          ])
          console.log('✅ Schemas created')
        },
        rollback: async () => {
          await prisma.$transaction([
            prisma.$executeRaw`DROP SCHEMA IF EXISTS tenant_shared CASCADE`,
            prisma.$executeRaw`DROP SCHEMA IF EXISTS tenant_kct CASCADE`,
            prisma.$executeRaw`DROP SCHEMA IF EXISTS analytics CASCADE`,
            prisma.$executeRaw`DROP SCHEMA IF EXISTS cache CASCADE`,
            prisma.$executeRaw`DROP SCHEMA IF EXISTS audit CASCADE`
          ])
        }
      },
      {
        name: 'create_audit_tables',
        description: 'Creating audit tables',
        execute: async () => {
          await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS audit.change_log (
              id SERIAL PRIMARY KEY,
              table_name VARCHAR(255) NOT NULL,
              record_id VARCHAR(255) NOT NULL,
              action VARCHAR(50) NOT NULL,
              changed_by VARCHAR(255),
              changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              old_values JSONB,
              new_values JSONB,
              schema_name VARCHAR(255) NOT NULL
            )
          `
          console.log('✅ Audit tables created')
        }
      },
      {
        name: 'check_table_dependencies',
        description: 'Checking table dependencies',
        execute: async () => {
          // Check foreign key dependencies
          const dependencies = await prisma.$queryRaw`
            SELECT 
              tc.table_name, 
              tc.constraint_name,
              ccu.table_name AS foreign_table_name
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            ORDER BY tc.table_name
          `
          console.log('✅ Dependencies checked:', (dependencies as any[]).length, 'foreign keys found')
        }
      },
      {
        name: 'migrate_shared_tables',
        description: 'Moving product tables to tenant_shared schema',
        execute: async () => {
          const sharedTables = [
            'products', 'product_variants', 'product_images', 'product_reviews',
            'suppliers', 'purchase_orders', 'purchase_order_items', 
            'inventory_logs', 'stock_alerts', 'collections', 
            'product_collections', 'color_palettes', 'event_profiles'
          ]

          for (const table of sharedTables) {
            try {
              await prisma.$executeRaw`ALTER TABLE IF EXISTS ${table} SET SCHEMA tenant_shared`
              console.log(`  ✓ Moved ${table} to tenant_shared`)
            } catch (error: any) {
              if (!error.message.includes('does not exist')) {
                throw error
              }
            }
          }
        }
      },
      {
        name: 'migrate_tenant_tables',
        description: 'Moving customer tables to tenant_kct schema',
        execute: async () => {
          const tenantTables = [
            'customers', 'orders', 'order_items', 'appointments', 'leads',
            'measurements', 'customer_profiles', 'purchase_histories',
            'saved_outfits', 'outfit_templates', 'outfit_components'
          ]

          for (const table of tenantTables) {
            try {
              await prisma.$executeRaw`ALTER TABLE IF EXISTS ${table} SET SCHEMA tenant_kct`
              console.log(`  ✓ Moved ${table} to tenant_kct`)
            } catch (error: any) {
              if (!error.message.includes('does not exist')) {
                throw error
              }
            }
          }
        }
      },
      {
        name: 'migrate_analytics_tables',
        description: 'Moving analytics tables to analytics schema',
        execute: async () => {
          const analyticsTables = [
            'customer_purchase_history', 'customer_size_analysis',
            'customer_insights', 'product_recommendations', 'customer_segments'
          ]

          for (const table of analyticsTables) {
            try {
              await prisma.$executeRaw`ALTER TABLE IF EXISTS ${table} SET SCHEMA analytics`
              console.log(`  ✓ Moved ${table} to analytics`)
            } catch (error: any) {
              if (!error.message.includes('does not exist')) {
                throw error
              }
            }
          }
        }
      },
      {
        name: 'update_search_path',
        description: 'Updating database search path',
        execute: async () => {
          await prisma.$executeRaw`
            ALTER DATABASE ${process.env.DATABASE_NAME || 'postgres'} 
            SET search_path TO public, tenant_shared, tenant_kct, analytics, cache, audit
          `
          console.log('✅ Search path updated')
        }
      },
      {
        name: 'verify_migration',
        description: 'Verifying migration',
        execute: async () => {
          const tableCount = await prisma.$queryRaw`
            SELECT 
              schemaname,
              COUNT(*) as table_count
            FROM pg_tables
            WHERE schemaname IN ('public', 'tenant_shared', 'tenant_kct', 'analytics')
              AND tableowner = current_user
            GROUP BY schemaname
            ORDER BY schemaname
          `
          
          console.log('✅ Migration verified:')
          for (const row of tableCount as any[]) {
            console.log(`  - ${row.schemaname}: ${row.table_count} tables`)
          }
        }
      }
    ]
  }

  async run() {
    console.log('🚀 Starting multi-schema migration...\n')

    for (const step of this.steps) {
      try {
        console.log(`\n📋 ${step.description}...`)
        await step.execute()
        this.completedSteps.push(step.name)
      } catch (error) {
        console.error(`\n❌ Error in step '${step.name}':`, error)
        
        // Ask user if they want to rollback
        console.log('\n🔄 Rolling back completed steps...')
        await this.rollback()
        throw error
      }
    }

    console.log('\n✅ Migration completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('1. Update your Prisma schema with @@schema directives')
    console.log('2. Run: npx prisma generate')
    console.log('3. Update your application code to use schema-aware clients')
    console.log('4. Test all database operations')
  }

  async rollback() {
    for (const stepName of this.completedSteps.reverse()) {
      const step = this.steps.find(s => s.name === stepName)
      if (step?.rollback) {
        try {
          console.log(`  Rolling back: ${step.description}`)
          await step.rollback()
        } catch (error) {
          console.error(`  Failed to rollback ${stepName}:`, error)
        }
      }
    }
  }
}

// Main execution
async function main() {
  try {
    const migration = new MultiSchemaMigration()
    await migration.run()
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}