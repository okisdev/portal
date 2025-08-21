/**
 * NextAuth.js to Better Auth Database Migration Script
 *
 * This script migrates your existing NextAuth.js database schema to be compatible
 * with Better Auth's expected structure AND applies schema improvements including
 * enum constraints, index optimizations, and type safety enhancements.
 *
 * It preserves all existing data while updating table structures and column names.
 *
 * Migration includes:
 * - NextAuth.js to Better Auth table structure updates
 * - Enum constraints for type safety (roles, timezones, status fields, etc.)
 * - Index cleanup and optimization
 * - Foreign key constraint updates
 *
 * Usage: bun run scripts/nextauth-to-better-auth-migration.ts
 *
 * IMPORTANT:
 * - Backup your database before running this migration
 * - This migration is designed to be idempotent (safe to run multiple times)
 * - Test in a development environment first
 * - Review enum constraints to ensure they match your data
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
  {
    name: 'user_drop_password',
    description:
      'Drop password column from portal_user (now stored in portal_account)',
    sql: 'ALTER TABLE portal_user DROP COLUMN IF EXISTS password',
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

  // Step 6: Add enum constraints for better type safety
  {
    name: 'user_add_role_constraint',
    description: 'Add enum constraint to portal_user role column',
    sql: `ALTER TABLE portal_user ADD CONSTRAINT user_role_check 
          CHECK (role IN ('ADMIN', 'SALES_MANAGER', 'SALES_ASSISTANT', 'MANAGER', 'USER'))`,
    required: false,
  },
  {
    name: 'user_add_timezone_constraint',
    description: 'Add enum constraint to portal_user timezone column',
    sql: `ALTER TABLE portal_user ADD CONSTRAINT user_timezone_check 
          CHECK (timezone IN (
            'Africa/Cairo', 'Africa/Casablanca', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
            'America/Anchorage', 'America/Argentina/Buenos_Aires', 'America/Bogota', 'America/Caracas', 'America/Chicago',
            'America/Denver', 'America/Edmonton', 'America/Halifax', 'America/Lima', 'America/Los_Angeles',
            'America/Mexico_City', 'America/New_York', 'America/Phoenix', 'America/Santiago', 'America/Sao_Paulo',
            'America/St_Johns', 'America/Toronto', 'America/Vancouver',
            'Asia/Almaty', 'Asia/Baghdad', 'Asia/Baku', 'Asia/Bangkok', 'Asia/Beirut', 'Asia/Colombo',
            'Asia/Dhaka', 'Asia/Dubai', 'Asia/Ho_Chi_Minh', 'Asia/Hong_Kong', 'Asia/Istanbul', 'Asia/Jakarta',
            'Asia/Jerusalem', 'Asia/Kabul', 'Asia/Karachi', 'Asia/Kathmandu', 'Asia/Kolkata', 'Asia/Kuala_Lumpur',
            'Asia/Kuwait', 'Asia/Manila', 'Asia/Muscat', 'Asia/Riyadh', 'Asia/Seoul', 'Asia/Shanghai',
            'Asia/Singapore', 'Asia/Taipei', 'Asia/Tashkent', 'Asia/Tehran', 'Asia/Tokyo', 'Asia/Ulaanbaatar', 'Asia/Yangon',
            'Atlantic/Azores', 'Atlantic/Cape_Verde', 'Atlantic/Reykjavik',
            'Australia/Adelaide', 'Australia/Brisbane', 'Australia/Darwin', 'Australia/Hobart', 'Australia/Melbourne',
            'Australia/Perth', 'Australia/Sydney',
            'Europe/Amsterdam', 'Europe/Athens', 'Europe/Belgrade', 'Europe/Berlin', 'Europe/Brussels',
            'Europe/Bucharest', 'Europe/Budapest', 'Europe/Copenhagen', 'Europe/Dublin', 'Europe/Helsinki',
            'Europe/Istanbul', 'Europe/Kiev', 'Europe/Lisbon', 'Europe/London', 'Europe/Madrid', 'Europe/Moscow',
            'Europe/Oslo', 'Europe/Paris', 'Europe/Prague', 'Europe/Rome', 'Europe/Stockholm', 'Europe/Vienna',
            'Europe/Warsaw', 'Europe/Zurich',
            'Indian/Maldives', 'Indian/Mauritius',
            'Pacific/Auckland', 'Pacific/Fiji', 'Pacific/Guam', 'Pacific/Honolulu', 'Pacific/Noumea',
            'Pacific/Pago_Pago', 'Pacific/Port_Moresby', 'Pacific/Tongatapu',
            'UTC'
          ))`,
    required: false,
  },
  {
    name: 'contact_activity_add_type_constraint',
    description: 'Add enum constraint to portal_contact_activity type column',
    sql: `ALTER TABLE portal_contact_activity ADD CONSTRAINT contact_activity_type_check 
          CHECK (type IN ('CONTACT', 'STATUS', 'PRIORITY', 'SOURCE', 'DATE', 'TEAM', 'CAMPAIGN', 'DEAL', 'PAYMENT', 'ENGAGEMENT'))`,
    required: false,
  },
  {
    name: 'contact_activity_add_subtype_constraint',
    description:
      'Add enum constraint to portal_contact_activity subType column',
    sql: `ALTER TABLE portal_contact_activity ADD CONSTRAINT contact_activity_subtype_check 
          CHECK ("subType" IN (
            'CONTACT_CREATED', 'CONTACT_UPDATED', 'CONTACT_DELETED',
            'STATUS_CHANGED', 'PRIORITY_CHANGED', 'SOURCE_CHANGED',
            'LAST_CONTACTED_UPDATED', 'LAST_CONTACTED_REMOVED', 'NEXT_FOLLOW_UP_UPDATED', 'NEXT_FOLLOW_UP_REMOVED',
            'MEETING_SCHEDULED', 'MEETING_UPDATED', 'MEETING_CANCELLED', 'CALL_LOGGED', 'EMAIL_SENT',
            'EMAIL_SCHEDULED', 'MESSAGE_SENT', 'MESSAGE_RECEIVED', 'NOTE_ADDED', 'REMARK_UPDATED',
            'TEAM_CREATED', 'TEAM_UPDATED', 'TEAM_DELETED', 'TEAM_CONTACT_ASSIGNED', 'TEAM_CONTACT_REMOVED',
            'CAMPAIGN_ASSIGNED', 'CAMPAIGN_REMOVED', 'CAMPAIGN_UPDATED',
            'DEAL_CREATED', 'DEAL_UPDATED', 'DEAL_CLOSED',
            'PAYMENT_LINK_CLICKED', 'PAYMENT_COMPLETED'
          ))`,
    required: false,
  },
  {
    name: 'team_activity_add_type_constraint',
    description: 'Add enum constraint to portal_team_activity type column',
    sql: `ALTER TABLE portal_team_activity ADD CONSTRAINT team_activity_type_check 
          CHECK (type IN ('CONTACT', 'STATUS', 'PRIORITY', 'SOURCE', 'DATE', 'TEAM', 'CAMPAIGN', 'DEAL', 'PAYMENT', 'ENGAGEMENT'))`,
    required: false,
  },
  {
    name: 'team_activity_add_subtype_constraint',
    description: 'Add enum constraint to portal_team_activity subType column',
    sql: `ALTER TABLE portal_team_activity ADD CONSTRAINT team_activity_subtype_check 
          CHECK ("subType" IN (
            'CONTACT_CREATED', 'CONTACT_UPDATED', 'CONTACT_DELETED',
            'STATUS_CHANGED', 'PRIORITY_CHANGED', 'SOURCE_CHANGED',
            'LAST_CONTACTED_UPDATED', 'LAST_CONTACTED_REMOVED', 'NEXT_FOLLOW_UP_UPDATED', 'NEXT_FOLLOW_UP_REMOVED',
            'MEETING_SCHEDULED', 'MEETING_UPDATED', 'MEETING_CANCELLED', 'CALL_LOGGED', 'EMAIL_SENT',
            'EMAIL_SCHEDULED', 'MESSAGE_SENT', 'MESSAGE_RECEIVED', 'NOTE_ADDED', 'REMARK_UPDATED',
            'TEAM_CREATED', 'TEAM_UPDATED', 'TEAM_DELETED', 'TEAM_CONTACT_ASSIGNED', 'TEAM_CONTACT_REMOVED',
            'CAMPAIGN_ASSIGNED', 'CAMPAIGN_REMOVED', 'CAMPAIGN_UPDATED',
            'DEAL_CREATED', 'DEAL_UPDATED', 'DEAL_CLOSED',
            'PAYMENT_LINK_CLICKED', 'PAYMENT_COMPLETED'
          ))`,
    required: false,
  },

  // Step 7: Clean up old complex indexes that are no longer needed
  {
    name: 'drop_old_verification_index',
    description: 'Drop old complex btree index on portal_verification',
    sql: 'DROP INDEX IF EXISTS idx_portal_verification_identifier',
    required: false,
  },
  {
    name: 'recreate_simple_verification_index',
    description: 'Create simple index on portal_verification identifier',
    sql: 'CREATE INDEX IF NOT EXISTS idx_portal_verification_identifier_simple ON portal_verification(identifier)',
    required: true,
  },
  {
    name: 'drop_old_user_email_index',
    description: 'Drop old complex btree index on portal_user email',
    sql: 'DROP INDEX IF EXISTS idx_portal_user_email',
    required: false,
  },
  {
    name: 'recreate_simple_user_email_index',
    description: 'Create simple index on portal_user email',
    sql: 'CREATE INDEX IF NOT EXISTS idx_portal_user_email_simple ON portal_user(email)',
    required: true,
  },
  {
    name: 'drop_old_session_indexes',
    description: 'Drop old complex btree indexes on portal_session',
    sql: 'DROP INDEX IF EXISTS idx_portal_session_expires_at; DROP INDEX IF EXISTS idx_portal_session_user_id',
    required: false,
  },
  {
    name: 'recreate_simple_session_indexes',
    description: 'Create simple indexes on portal_session',
    sql: 'CREATE INDEX IF NOT EXISTS idx_portal_session_expires_at_simple ON portal_session(expires_at); CREATE INDEX IF NOT EXISTS idx_portal_session_user_id_simple ON portal_session("userId")',
    required: true,
  },

  // Step 8: Add unique constraint on session token (required by new schema)
  {
    name: 'session_add_token_unique',
    description: 'Add unique constraint on portal_session token column',
    sql: 'ALTER TABLE portal_session ADD CONSTRAINT portal_session_token_unique UNIQUE (token)',
    required: true,
  },

  // Step 9: Add enum constraints for calendar and resource tables
  {
    name: 'calendar_folder_add_visibility_constraint',
    description:
      'Add enum constraint to portal_calendar_folder visibility column',
    sql: `ALTER TABLE portal_calendar_folder ADD CONSTRAINT calendar_folder_visibility_check 
          CHECK (visibility IN ('PUBLIC', 'SHARED', 'PRIVATE'))`,
    required: false,
  },
  {
    name: 'calendar_event_participant_add_constraints',
    description:
      'Add enum constraints to portal_calendar_event_participant columns',
    sql: `ALTER TABLE portal_calendar_event_participant 
          ADD CONSTRAINT calendar_event_participant_type_check 
          CHECK ("participantType" IN ('user', 'contact', 'external')),
          ADD CONSTRAINT calendar_event_participant_status_check 
          CHECK (status IN ('pending', 'accepted', 'declined', 'tentative')),
          ADD CONSTRAINT calendar_event_participant_role_check 
          CHECK (role IN ('organizer', 'required', 'optional'))`,
    required: false,
  },
  {
    name: 'calendar_event_share_add_permission_constraint',
    description:
      'Add enum constraint to portal_calendar_event_share permission column',
    sql: `ALTER TABLE portal_calendar_event_share ADD CONSTRAINT calendar_event_share_permission_check 
          CHECK (permission IN ('view', 'edit'))`,
    required: false,
  },
  {
    name: 'resource_content_add_visibility_constraint',
    description:
      'Add enum constraint to portal_resource_content visibility column',
    sql: `ALTER TABLE portal_resource_content ADD CONSTRAINT resource_content_visibility_check 
          CHECK (visibility IN ('PUBLIC', 'SHARED', 'PRIVATE'))`,
    required: false,
  },
  {
    name: 'resource_content_share_add_permission_constraint',
    description:
      'Add enum constraint to portal_resource_content_share permission column',
    sql: `ALTER TABLE portal_resource_content_share ADD CONSTRAINT resource_content_share_permission_check 
          CHECK (permission IN ('view', 'edit'))`,
    required: false,
  },
  {
    name: 'resource_content_send_track_add_status_constraint',
    description:
      'Add enum constraint to portal_resource_content_send_track status column',
    sql: `ALTER TABLE portal_resource_content_send_track ADD CONSTRAINT resource_content_send_track_status_check 
          CHECK (status IN ('sent', 'delivered', 'read', 'failed'))`,
    required: false,
  },
  {
    name: 'resource_emails_add_visibility_constraint',
    description:
      'Add enum constraint to portal_resource_emails visibility column',
    sql: `ALTER TABLE portal_resource_emails ADD CONSTRAINT resource_emails_visibility_check 
          CHECK (visibility IN ('PUBLIC', 'SHARED', 'PRIVATE'))`,
    required: false,
  },

  // Step 10: Add enum constraints for company and team tables
  {
    name: 'company_add_status_constraint',
    description: 'Add enum constraint to portal_company status column',
    sql: `ALTER TABLE portal_company ADD CONSTRAINT company_status_check 
          CHECK (status IN ('active', 'inactive'))`,
    required: false,
  },
  {
    name: 'company_contact_add_role_constraint',
    description: 'Add enum constraint to portal_company_contact role column',
    sql: `ALTER TABLE portal_company_contact ADD CONSTRAINT company_contact_role_check 
          CHECK (role IN ('employee', 'manager', 'executive', 'other'))`,
    required: false,
  },
  {
    name: 'team_meeting_add_status_constraint',
    description: 'Add enum constraint to portal_team_meeting status column',
    sql: `ALTER TABLE portal_team_meeting ADD CONSTRAINT team_meeting_status_check 
          CHECK (status IN ('upcoming', 'completed', 'cancelled', 'no_show'))`,
    required: false,
  },
  {
    name: 'user_task_add_constraints',
    description:
      'Add enum constraints to portal_user_task status and priority columns',
    sql: `ALTER TABLE portal_user_task 
          ADD CONSTRAINT user_task_status_check 
          CHECK (status IN ('backlog', 'todo', 'in_progress', 'in_review', 'done')),
          ADD CONSTRAINT user_task_priority_check 
          CHECK (priority IN ('urgent', 'high', 'medium', 'low'))`,
    required: false,
  },

  // Step 11: Add enum constraints for custom field tables
  {
    name: 'contact_custom_field_add_type_constraint',
    description:
      'Add enum constraint to portal_contact_custom_field type column',
    sql: `ALTER TABLE portal_contact_custom_field ADD CONSTRAINT contact_custom_field_type_check 
          CHECK (type IN ('text', 'number', 'date', 'boolean', 'select', 'multiselect'))`,
    required: false,
  },
  {
    name: 'team_custom_field_add_type_constraint',
    description: 'Add enum constraint to portal_team_custom_field type column',
    sql: `ALTER TABLE portal_team_custom_field ADD CONSTRAINT team_custom_field_type_check 
          CHECK (type IN ('text', 'number', 'date', 'boolean', 'select', 'multiselect'))`,
    required: false,
  },
  {
    name: 'company_custom_field_add_type_constraint',
    description:
      'Add enum constraint to portal_company_custom_field type column',
    sql: `ALTER TABLE portal_company_custom_field ADD CONSTRAINT company_custom_field_type_check 
          CHECK (type IN ('text', 'number', 'date', 'boolean', 'select', 'multiselect'))`,
    required: false,
  },
  {
    name: 'site_config_add_constraints',
    description:
      'Add enum constraints to portal_site_config key and type columns',
    sql: `ALTER TABLE portal_site_config 
          ADD CONSTRAINT site_config_key_check 
          CHECK (key IN ('name', 'description', 'domain', 'supportEmailDomains', 'status', 'priority', 'source')),
          ADD CONSTRAINT site_config_type_check 
          CHECK (type IN ('string', 'number', 'boolean', 'json', 'array'))`,
    required: false,
  },
  {
    name: 'user_notifications_add_constraints',
    description: 'Add enum constraints to portal_user_notifications columns',
    sql: `ALTER TABLE portal_user_notifications 
          ADD CONSTRAINT user_notifications_type_check 
          CHECK (type IN ('MESSAGE')),
          ADD CONSTRAINT user_notifications_subtype_check 
          CHECK (sub_type IN ('MENTIONED', 'NOTE_ADDED', 'NOTE_UPDATED', 'NOTE_DELETED')),
          ADD CONSTRAINT user_notifications_initiator_type_check 
          CHECK (initiator_type IN ('user', 'contact', 'team', 'system'))`,
    required: false,
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
