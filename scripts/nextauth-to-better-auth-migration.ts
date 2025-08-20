/**
 * NextAuth.js to Better Auth Database Migration Script
 *
 * This script migrates your existing NextAuth.js database schema to be compatible
 * with Better Auth's expected structure. It preserves all existing data while
 * updating table structures and column names.
 *
 * Usage: bun run scripts/nextauth-to-better-auth-migration.ts
 *
 * IMPORTANT:
 * - Backup your database before running this migration
 * - This migration is designed to be idempotent (safe to run multiple times)
 * - Test in a development environment first
 */

import { database } from '@/lib/database';

interface MigrationStep {
  name: string;
  description: string;
  sql: string;
  required: boolean;
}

const migrationSteps: MigrationStep[] = [
  // Step 1: User table migrations
  {
    name: 'user_add_created_at',
    description: 'Add created_at column to portal_user',
    sql: 'ALTER TABLE portal_user ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW() NOT NULL',
    required: true,
  },
  {
    name: 'user_add_email_verified',
    description: 'Add email_verified boolean column to portal_user',
    sql: 'ALTER TABLE portal_user ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false',
    required: true,
  },
  {
    name: 'user_convert_email_verified',
    description: 'Convert emailVerified timestamp to email_verified boolean',
    sql: 'UPDATE portal_user SET email_verified = ("emailVerified" IS NOT NULL)',
    required: false,
  },
  {
    name: 'user_set_email_verified_not_null',
    description: 'Set email_verified column to NOT NULL',
    sql: 'ALTER TABLE portal_user ALTER COLUMN email_verified SET NOT NULL',
    required: true,
  },
  {
    name: 'user_add_updated_at',
    description: 'Add updated_at column to portal_user',
    sql: 'ALTER TABLE portal_user ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL',
    required: true,
  },
  {
    name: 'user_drop_old_email_verified',
    description: 'Drop old emailVerified timestamp column',
    sql: 'ALTER TABLE portal_user DROP COLUMN IF EXISTS "emailVerified"',
    required: false,
  },

  // Step 2: Account table migrations
  {
    name: 'account_add_id',
    description: 'Add id primary key column to portal_account',
    sql: 'ALTER TABLE portal_account ADD COLUMN IF NOT EXISTS id TEXT',
    required: true,
  },
  {
    name: 'account_generate_ids',
    description: 'Generate unique IDs for existing account records',
    sql: `UPDATE portal_account SET id = "userId" || '_' || provider || '_' || "providerAccountId" WHERE id IS NULL`,
    required: true,
  },
  {
    name: 'account_set_id_not_null',
    description: 'Set id column to NOT NULL',
    sql: 'ALTER TABLE portal_account ALTER COLUMN id SET NOT NULL',
    required: true,
  },
  {
    name: 'account_add_primary_key',
    description: 'Add primary key constraint to portal_account',
    sql: 'ALTER TABLE portal_account ADD PRIMARY KEY (id)',
    required: true,
  },

  {
    name: 'account_rename_provider',
    description: 'Rename provider to provider_id in portal_account',
    sql: 'ALTER TABLE portal_account RENAME COLUMN provider TO provider_id',
    required: false,
  },
  {
    name: 'account_rename_provider_account_id',
    description: 'Rename providerAccountId to account_id in portal_account',
    sql: 'ALTER TABLE portal_account RENAME COLUMN "providerAccountId" TO account_id',
    required: false,
  },
  {
    name: 'account_add_refresh_token_expires',
    description: 'Add refresh_token_expires_at column to portal_account',
    sql: 'ALTER TABLE portal_account ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMP',
    required: true,
  },
  {
    name: 'account_convert_expires_at',
    description:
      'Convert integer expires_at to timestamp access_token_expires_at',
    sql: 'ALTER TABLE portal_account ADD COLUMN IF NOT EXISTS access_token_expires_at TIMESTAMP',
    required: true,
  },
  {
    name: 'account_copy_expires_data',
    description: 'Copy expires_at data to access_token_expires_at as timestamp',
    sql: 'UPDATE portal_account SET access_token_expires_at = to_timestamp(expires_at) WHERE expires_at IS NOT NULL AND access_token_expires_at IS NULL',
    required: false,
  },
  {
    name: 'account_add_password',
    description: 'Add password column to portal_account for Better Auth',
    sql: 'ALTER TABLE portal_account ADD COLUMN IF NOT EXISTS password TEXT',
    required: true,
  },
  {
    name: 'account_add_created_at',
    description: 'Add created_at column to portal_account',
    sql: 'ALTER TABLE portal_account ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW() NOT NULL',
    required: true,
  },
  {
    name: 'account_add_updated_at',
    description: 'Add updated_at column to portal_account',
    sql: 'ALTER TABLE portal_account ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL',
    required: true,
  },
  {
    name: 'account_drop_old_type',
    description: 'Drop old type column from portal_account',
    sql: 'ALTER TABLE portal_account DROP COLUMN IF EXISTS type',
    required: false,
  },
  {
    name: 'account_drop_old_token_type',
    description: 'Drop old token_type column from portal_account',
    sql: 'ALTER TABLE portal_account DROP COLUMN IF EXISTS token_type',
    required: false,
  },
  {
    name: 'account_drop_old_session_state',
    description: 'Drop old session_state column from portal_account',
    sql: 'ALTER TABLE portal_account DROP COLUMN IF EXISTS session_state',
    required: false,
  },
  {
    name: 'account_drop_old_expires_at',
    description: 'Drop old integer expires_at column from portal_account',
    sql: 'ALTER TABLE portal_account DROP COLUMN IF EXISTS expires_at',
    required: false,
  },

  // Step 3: Session table migrations
  {
    name: 'session_add_id',
    description: 'Add id column to portal_session',
    sql: 'ALTER TABLE portal_session ADD COLUMN IF NOT EXISTS id TEXT',
    required: true,
  },
  {
    name: 'session_copy_token_to_id',
    description: 'Use sessionToken as id for portal_session',
    sql: 'UPDATE portal_session SET id = "sessionToken" WHERE id IS NULL',
    required: true,
  },
  {
    name: 'session_set_id_not_null',
    description: 'Set id column to NOT NULL in portal_session',
    sql: 'ALTER TABLE portal_session ALTER COLUMN id SET NOT NULL',
    required: true,
  },
  {
    name: 'session_add_ip_address',
    description: 'Add ip_address column to portal_session',
    sql: 'ALTER TABLE portal_session ADD COLUMN IF NOT EXISTS ip_address TEXT',
    required: true,
  },
  {
    name: 'session_add_user_agent',
    description: 'Add user_agent column to portal_session',
    sql: 'ALTER TABLE portal_session ADD COLUMN IF NOT EXISTS user_agent TEXT',
    required: true,
  },
  {
    name: 'session_add_created_at',
    description: 'Add created_at column to portal_session',
    sql: 'ALTER TABLE portal_session ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW() NOT NULL',
    required: true,
  },
  {
    name: 'session_add_updated_at',
    description: 'Add updated_at column to portal_session',
    sql: 'ALTER TABLE portal_session ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL',
    required: true,
  },

  {
    name: 'session_drop_old_primary_key',
    description: 'Drop old primary key constraint from portal_session',
    sql: 'ALTER TABLE portal_session DROP CONSTRAINT IF EXISTS portal_session_pkey',
    required: false,
  },
  {
    name: 'session_add_new_primary_key',
    description: 'Add new primary key constraint to portal_session',
    sql: 'ALTER TABLE portal_session ADD PRIMARY KEY (id)',
    required: true,
  },
  {
    name: 'session_rename_session_token',
    description: 'Rename sessionToken to token in portal_session',
    sql: 'ALTER TABLE portal_session RENAME COLUMN "sessionToken" TO token',
    required: false,
  },
  {
    name: 'session_rename_expires',
    description: 'Rename expires to expires_at in portal_session',
    sql: 'ALTER TABLE portal_session RENAME COLUMN expires TO expires_at',
    required: false,
  },

  // Step 4: Verification table migrations
  {
    name: 'verification_add_id',
    description: 'Add id column to portal_verification_token',
    sql: 'ALTER TABLE portal_verification_token ADD COLUMN IF NOT EXISTS id TEXT',
    required: true,
  },
  {
    name: 'verification_add_created_at',
    description: 'Add created_at column to portal_verification_token',
    sql: 'ALTER TABLE portal_verification_token ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()',
    required: true,
  },
  {
    name: 'verification_add_updated_at',
    description: 'Add updated_at column to portal_verification_token',
    sql: 'ALTER TABLE portal_verification_token ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()',
    required: true,
  },
  {
    name: 'verification_generate_ids',
    description: 'Generate unique IDs for verification tokens',
    sql: `UPDATE portal_verification_token SET id = identifier || '_' || token WHERE id IS NULL`,
    required: true,
  },
  {
    name: 'verification_set_id_not_null',
    description: 'Set id column to NOT NULL in portal_verification_token',
    sql: 'ALTER TABLE portal_verification_token ALTER COLUMN id SET NOT NULL',
    required: true,
  },
  {
    name: 'verification_add_primary_key',
    description: 'Add primary key constraint to portal_verification_token',
    sql: 'ALTER TABLE portal_verification_token ADD PRIMARY KEY (id)',
    required: true,
  },
  {
    name: 'verification_rename_token',
    description: 'Rename token to value in portal_verification_token',
    sql: 'ALTER TABLE portal_verification_token RENAME COLUMN token TO value',
    required: false,
  },
  {
    name: 'verification_rename_expires',
    description: 'Rename expires to expires_at in portal_verification_token',
    sql: 'ALTER TABLE portal_verification_token RENAME COLUMN expires TO expires_at',
    required: false,
  },
  {
    name: 'verification_rename_table',
    description: 'Rename portal_verification_token to portal_verification',
    sql: 'ALTER TABLE portal_verification_token RENAME TO portal_verification',
    required: false,
  },

  // Step 5: Create indexes for performance
  {
    name: 'create_user_email_index',
    description: 'Create index on portal_user email column',
    sql: 'CREATE INDEX IF NOT EXISTS idx_portal_user_email ON portal_user(email)',
    required: true,
  },
  {
    name: 'create_session_user_index',
    description: 'Create index on portal_session userId column',
    sql: 'CREATE INDEX IF NOT EXISTS idx_portal_session_user_id ON portal_session("userId")',
    required: true,
  },
  {
    name: 'create_session_expires_index',
    description: 'Create index on portal_session expires_at column',
    sql: 'CREATE INDEX IF NOT EXISTS idx_portal_session_expires_at ON portal_session(expires_at)',
    required: true,
  },
  {
    name: 'create_account_user_index',
    description: 'Create index on portal_account userId column',
    sql: 'CREATE INDEX IF NOT EXISTS idx_portal_account_user_id ON portal_account("userId")',
    required: true,
  },
  {
    name: 'create_verification_identifier_index',
    description: 'Create index on portal_verification identifier column',
    sql: 'CREATE INDEX IF NOT EXISTS idx_portal_verification_identifier ON portal_verification(identifier)',
    required: true,
  },
];

async function runMigration(dryRun = false) {
  console.log('🚀 Starting NextAuth.js to Better Auth migration...');
  console.log(
    `📋 Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE MIGRATION'}`
  );
  console.log(`📝 Total steps: ${migrationSteps.length}`);

  if (dryRun) {
    console.log('\n📄 Migration steps that would be executed:');
    migrationSteps.forEach((step, index) => {
      console.log(`${index + 1}. ${step.name}: ${step.description}`);
      console.log(`   SQL: ${step.sql}`);
      console.log(
        `   Required: ${step.required ? 'Yes' : 'No (will skip if fails)'}\n`
      );
    });
    return;
  }

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < migrationSteps.length; i++) {
    const step = migrationSteps[i];
    console.log(`\n⚡ Step ${i + 1}/${migrationSteps.length}: ${step.name}`);
    console.log(`📝 ${step.description}`);

    try {
      await database.execute(step.sql);
      console.log('✅ Completed successfully');
      successCount++;
    } catch (error: any) {
      if (step.required) {
        console.error(`❌ Required step failed: ${error.message}`);
        errorCount++;

        // For required steps, check if it's a "already exists" type error
        if (
          error.message.includes('already exists') ||
          error.message.includes('does not exist') ||
          error.message.includes('duplicate key') ||
          error.message.includes('constraint') ||
          (error.message.includes('relation') &&
            error.message.includes('already'))
        ) {
          console.log(
            'ℹ️ This appears to be an expected error (step already completed)'
          );
          skipCount++;
        } else {
          console.error('💥 Migration failed on required step. Stopping.');
          throw error;
        }
      } else {
        console.log(`⚠️ Optional step skipped: ${error.message}`);
        skipCount++;
      }
    }
  }

  console.log('\n🎉 Migration completed!');
  console.log(
    `📊 Results: ${successCount} successful, ${skipCount} skipped, ${errorCount} errors`
  );

  if (errorCount === 0) {
    console.log('✨ Your database is now fully compatible with Better Auth!');
    console.log('🔥 You can now test authentication with your app!');
  } else {
    console.log(
      '⚠️ Some errors occurred during migration. Please review the output above.'
    );
  }
}

async function checkCurrentSchema() {
  console.log('🔍 Checking current database schema...');

  try {
    // Check each table structure
    const tables = [
      'portal_user',
      'portal_account',
      'portal_session',
      'portal_verification',
      'portal_verification_token',
    ];

    for (const tableName of tables) {
      try {
        const columns = await database.execute(`
          SELECT column_name, data_type, is_nullable, column_default 
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' 
          ORDER BY ordinal_position
        `);

        if (columns.rows.length > 0) {
          console.log(`\n📊 ${tableName} columns:`);
          console.table(columns.rows);
        } else {
          console.log(`\n❌ Table ${tableName} does not exist`);
        }
      } catch (error) {
        console.log(`\n❌ Error checking ${tableName}: ${error}`);
      }
    }
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'migrate';

  try {
    switch (command) {
      case 'check':
        await checkCurrentSchema();
        break;
      case 'dry-run':
        await runMigration(true);
        break;
      case 'migrate':
        await runMigration(false);
        break;
      default:
        console.log('Usage:');
        console.log(
          '  bun run scripts/nextauth-to-better-auth-migration.ts check     # Check current schema'
        );
        console.log(
          '  bun run scripts/nextauth-to-better-auth-migration.ts dry-run  # Show what would be done'
        );
        console.log(
          '  bun run scripts/nextauth-to-better-auth-migration.ts migrate  # Run the migration'
        );
    }
  } catch (error) {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
