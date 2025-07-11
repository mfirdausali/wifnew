-- Manual migration for complete users management schema
-- This handles existing data in the database

-- Step 1: Update enums
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SALES_MANAGER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'FINANCE_MANAGER';  
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'OPERATIONS_MANAGER';

-- Remove old enum values will be done later after data migration

-- Step 2: Create new enums
DO $$ BEGIN
    CREATE TYPE "PermissionRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 3: Create departments table first (no dependencies)
CREATE TABLE IF NOT EXISTS "departments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" UUID,
    "level" INTEGER NOT NULL DEFAULT 0,
    "path" VARCHAR(500),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "manager_id" UUID,
    "deputy_manager_id" UUID,
    "email" TEXT,
    "phone" TEXT,
    "location" VARCHAR(500),
    "budget_code" TEXT,
    "cost_center" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "custom_fields" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
ALTER TABLE "departments" ADD CONSTRAINT "departments_code_key" UNIQUE ("code");

-- Step 4: Add new columns to users table with safe defaults
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "email_normalized" TEXT,
ADD COLUMN IF NOT EXISTS "email_verified_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "middle_name" TEXT,
ADD COLUMN IF NOT EXISTS "full_name" TEXT,
ADD COLUMN IF NOT EXISTS "initials" TEXT,
ADD COLUMN IF NOT EXISTS "position" TEXT,
ADD COLUMN IF NOT EXISTS "department_id" UUID,
ADD COLUMN IF NOT EXISTS "manager_id" UUID,
ADD COLUMN IF NOT EXISTS "employment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "employment_type" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
ADD COLUMN IF NOT EXISTS "password_hash" TEXT,
ADD COLUMN IF NOT EXISTS "password_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "password_expires_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "require_password_change" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "password_reset_token" TEXT,
ADD COLUMN IF NOT EXISTS "password_reset_expires" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "access_level" SMALLINT,
ADD COLUMN IF NOT EXISTS "phone" TEXT,
ADD COLUMN IF NOT EXISTS "phone_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "phone_country_code" TEXT,
ADD COLUMN IF NOT EXISTS "phone_national" TEXT,
ADD COLUMN IF NOT EXISTS "avatar_url" TEXT,
ADD COLUMN IF NOT EXISTS "avatar_thumbnail_url" TEXT,
ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN IF NOT EXISTS "date_format" TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
ADD COLUMN IF NOT EXISTS "time_format" TEXT NOT NULL DEFAULT '24h',
ADD COLUMN IF NOT EXISTS "status_reason" TEXT,
ADD COLUMN IF NOT EXISTS "suspension_end_date" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "last_activity_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "last_password_change_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "login_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "failed_login_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "failed_login_last_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "two_factor_secret" TEXT,
ADD COLUMN IF NOT EXISTS "two_factor_backup_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "security_questions" JSONB,
ADD COLUMN IF NOT EXISTS "notification_preferences" JSONB NOT NULL DEFAULT '{"email": true, "sms": false, "push": true, "desktop": true}',
ADD COLUMN IF NOT EXISTS "ui_preferences" JSONB NOT NULL DEFAULT '{"theme": "light", "density": "normal", "sidebar_collapsed": false}',
ADD COLUMN IF NOT EXISTS "created_by" UUID,
ADD COLUMN IF NOT EXISTS "updated_by" UUID,
ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deleted_by" UUID,
ADD COLUMN IF NOT EXISTS "custom_fields" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Step 5: Migrate existing data
UPDATE "users" SET 
    "email_normalized" = LOWER("email"),
    "password_hash" = "password",
    "access_level" = CASE 
        WHEN "role" = 'ADMIN' THEN 5
        WHEN "role" IN ('SALES', 'FINANCE', 'OPERATIONS') THEN 3
        ELSE 2
    END;

-- Update role values
UPDATE "users" SET "role" = 'SALES_MANAGER' WHERE "role" = 'SALES';
UPDATE "users" SET "role" = 'FINANCE_MANAGER' WHERE "role" = 'FINANCE';
UPDATE "users" SET "role" = 'OPERATIONS_MANAGER' WHERE "role" = 'OPERATIONS';

-- Rename columns
ALTER TABLE "users" 
    RENAME COLUMN "profile_picture" TO "old_profile_picture";
ALTER TABLE "users" 
    RENAME COLUMN "phone_number" TO "old_phone_number";
ALTER TABLE "users" 
    RENAME COLUMN "department" TO "old_department";

-- Copy data to new columns
UPDATE "users" SET 
    "avatar_url" = "old_profile_picture",
    "phone" = "old_phone_number";

-- Create unique constraint on email_normalized
ALTER TABLE "users" ADD CONSTRAINT "users_email_normalized_key" UNIQUE ("email_normalized");

-- Step 6: Create permissions table
CREATE TABLE IF NOT EXISTS "permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "module" TEXT,
    "parent_id" UUID,
    "level" INTEGER NOT NULL DEFAULT 0,
    "path" VARCHAR(500),
    "risk_level" "PermissionRiskLevel" NOT NULL DEFAULT 'LOW',
    "requires_2fa" BOOLEAN NOT NULL DEFAULT false,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "default_for_roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excluded_from_roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "min_access_level" SMALLINT NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_code_key" UNIQUE ("code");

-- Step 7: Create user_permissions table
CREATE TABLE IF NOT EXISTS "user_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "granted_by" UUID,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grant_reason" TEXT,
    "expires_at" TIMESTAMP(3),
    "can_delegate" BOOLEAN NOT NULL DEFAULT false,
    "delegation_limit" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB,
    "revoked_at" TIMESTAMP(3),
    "revoked_by" UUID,
    "revoke_reason" TEXT,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_permission_id_key" UNIQUE ("user_id", "permission_id");

-- Step 8: Create user_activity_logs table
CREATE TABLE IF NOT EXISTS "user_activity_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "action_category" VARCHAR(50),
    "resource_type" VARCHAR(100),
    "resource_id" TEXT,
    "resource_name" VARCHAR(500),
    "method" VARCHAR(10),
    "path" VARCHAR(500),
    "query_params" JSONB,
    "request_body" JSONB,
    "response_status" INTEGER,
    "response_time_ms" INTEGER,
    "ip_address" TEXT,
    "ip_location" JSONB,
    "user_agent" TEXT,
    "device_info" JSONB,
    "session_id" TEXT,
    "details" JSONB,
    "error_message" TEXT,
    "stack_trace" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_date" DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT "user_activity_logs_pkey" PRIMARY KEY ("id")
);

-- Step 9: Create user_sessions table
CREATE TABLE IF NOT EXISTS "user_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "access_token_hash" TEXT NOT NULL,
    "refresh_token_hash" TEXT,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT,
    "device_id" TEXT,
    "device_info" JSONB,
    "country_code" VARCHAR(2),
    "region" VARCHAR(100),
    "city" VARCHAR(100),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "revoked_at" TIMESTAMP(3),
    "revoked_by" UUID,
    "revoke_reason" VARCHAR(100),
    "security_flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "risk_score" DECIMAL(3,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_access_token_hash_key" UNIQUE ("access_token_hash");
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_refresh_token_hash_key" UNIQUE ("refresh_token_hash");

-- Step 10: Update audit_logs table
ALTER TABLE "audit_logs" 
ADD COLUMN IF NOT EXISTS "user_email" TEXT,
ADD COLUMN IF NOT EXISTS "user_name" VARCHAR(305),
ADD COLUMN IF NOT EXISTS "impersonated_by" UUID,
ADD COLUMN IF NOT EXISTS "target_type" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "target_id" TEXT,
ADD COLUMN IF NOT EXISTS "target_name" VARCHAR(500),
ADD COLUMN IF NOT EXISTS "target_user_id" UUID,
ADD COLUMN IF NOT EXISTS "action_category" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "old_values" JSONB,
ADD COLUMN IF NOT EXISTS "new_values" JSONB,
ADD COLUMN IF NOT EXISTS "changed_fields" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "session_id" UUID,
ADD COLUMN IF NOT EXISTS "request_id" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "reason" TEXT,
ADD COLUMN IF NOT EXISTS "success" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "error_code" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "error_message" TEXT,
ADD COLUMN IF NOT EXISTS "retention_days" INTEGER NOT NULL DEFAULT 2555,
ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3);

-- Update existing audit logs
UPDATE "audit_logs" SET 
    "target_type" = "resource",
    "target_id" = "resource_id",
    "action_category" = 'general';

-- Step 11: Create remaining tables
CREATE TABLE IF NOT EXISTS "password_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "change_reason" VARCHAR(100),
    "change_ip" TEXT,
    "change_user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "email_verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_count" INTEGER NOT NULL DEFAULT 1,
    "last_sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_ip" TEXT,
    "verified_user_agent" TEXT,

    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_token_key" UNIQUE ("token");

CREATE TABLE IF NOT EXISTS "import_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "filename" VARCHAR(500) NOT NULL,
    "file_size" BIGINT,
    "file_hash" VARCHAR(64),
    "format" VARCHAR(20) NOT NULL,
    "total_rows" INTEGER NOT NULL,
    "processed_rows" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "skip_count" INTEGER NOT NULL DEFAULT 0,
    "results" JSONB,
    "errors" JSONB,
    "imported_by" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "duration_ms" INTEGER,
    "status" VARCHAR(50) NOT NULL DEFAULT 'processing',

    CONSTRAINT "import_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "export_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "format" VARCHAR(20) NOT NULL,
    "filters" JSONB,
    "fields" TEXT[] NOT NULL,
    "row_count" INTEGER,
    "file_size" BIGINT,
    "file_url" VARCHAR(500),
    "exported_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "last_downloaded_at" TIMESTAMP(3),

    CONSTRAINT "export_logs_pkey" PRIMARY KEY ("id")
);

-- Step 12: Create all indexes
CREATE INDEX IF NOT EXISTS "users_email_normalized_idx" ON "users"("email_normalized");
CREATE INDEX IF NOT EXISTS "users_department_id_idx" ON "users"("department_id");
CREATE INDEX IF NOT EXISTS "users_manager_id_idx" ON "users"("manager_id");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users"("status");
CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users"("created_at");
CREATE INDEX IF NOT EXISTS "users_last_login_at_idx" ON "users"("last_login_at");
CREATE INDEX IF NOT EXISTS "users_deleted_at_idx" ON "users"("deleted_at");
CREATE INDEX IF NOT EXISTS "users_role_access_level_idx" ON "users"("role", "access_level");
CREATE INDEX IF NOT EXISTS "users_created_at_desc_composite_idx" ON "users"("created_at" DESC, "id", "email", "first_name", "last_name", "role", "department_id", "status");

CREATE INDEX IF NOT EXISTS "permissions_category_idx" ON "permissions"("category");
CREATE INDEX IF NOT EXISTS "permissions_module_idx" ON "permissions"("module");
CREATE INDEX IF NOT EXISTS "permissions_parent_id_idx" ON "permissions"("parent_id");
CREATE INDEX IF NOT EXISTS "permissions_path_idx" ON "permissions"("path");
CREATE INDEX IF NOT EXISTS "permissions_code_idx" ON "permissions"("code");
CREATE INDEX IF NOT EXISTS "permissions_is_active_idx" ON "permissions"("is_active");

CREATE INDEX IF NOT EXISTS "user_permissions_user_id_idx" ON "user_permissions"("user_id");
CREATE INDEX IF NOT EXISTS "user_permissions_permission_id_idx" ON "user_permissions"("permission_id");
CREATE INDEX IF NOT EXISTS "user_permissions_expires_at_idx" ON "user_permissions"("expires_at");
CREATE INDEX IF NOT EXISTS "user_permissions_granted_by_idx" ON "user_permissions"("granted_by");
CREATE INDEX IF NOT EXISTS "user_permissions_revoked_at_idx" ON "user_permissions"("revoked_at");

CREATE INDEX IF NOT EXISTS "departments_code_idx" ON "departments"("code");
CREATE INDEX IF NOT EXISTS "departments_parent_id_idx" ON "departments"("parent_id");
CREATE INDEX IF NOT EXISTS "departments_path_idx" ON "departments"("path");
CREATE INDEX IF NOT EXISTS "departments_manager_id_idx" ON "departments"("manager_id");
CREATE INDEX IF NOT EXISTS "departments_is_active_idx" ON "departments"("is_active");

CREATE INDEX IF NOT EXISTS "user_activity_logs_user_id_idx" ON "user_activity_logs"("user_id");
CREATE INDEX IF NOT EXISTS "user_activity_logs_created_at_idx" ON "user_activity_logs"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "user_activity_logs_action_idx" ON "user_activity_logs"("action");
CREATE INDEX IF NOT EXISTS "user_activity_logs_resource_idx" ON "user_activity_logs"("resource_type", "resource_id");
CREATE INDEX IF NOT EXISTS "user_activity_logs_ip_address_idx" ON "user_activity_logs"("ip_address");
CREATE INDEX IF NOT EXISTS "user_activity_logs_session_id_idx" ON "user_activity_logs"("session_id");
CREATE INDEX IF NOT EXISTS "user_activity_logs_created_date_idx" ON "user_activity_logs"("created_date");
CREATE INDEX IF NOT EXISTS "user_activity_logs_composite_idx" ON "user_activity_logs"("user_id", "created_at" DESC, "action");

CREATE INDEX IF NOT EXISTS "user_sessions_user_id_idx" ON "user_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "user_sessions_access_token_hash_idx" ON "user_sessions"("access_token_hash");
CREATE INDEX IF NOT EXISTS "user_sessions_refresh_token_hash_idx" ON "user_sessions"("refresh_token_hash");
CREATE INDEX IF NOT EXISTS "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");
CREATE INDEX IF NOT EXISTS "user_sessions_device_id_idx" ON "user_sessions"("device_id");
CREATE INDEX IF NOT EXISTS "user_sessions_ip_address_idx" ON "user_sessions"("ip_address");
CREATE INDEX IF NOT EXISTS "user_sessions_is_active_idx" ON "user_sessions"("is_active");

CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_target_idx" ON "audit_logs"("target_type", "target_id");
CREATE INDEX IF NOT EXISTS "audit_logs_target_user_id_idx" ON "audit_logs"("target_user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "audit_logs_ip_address_idx" ON "audit_logs"("ip_address");
CREATE INDEX IF NOT EXISTS "audit_logs_action_category_idx" ON "audit_logs"("action_category");

CREATE INDEX IF NOT EXISTS "password_history_user_id_idx" ON "password_history"("user_id");
CREATE INDEX IF NOT EXISTS "password_history_created_at_idx" ON "password_history"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "password_history_expires_at_idx" ON "password_history"("expires_at");

CREATE INDEX IF NOT EXISTS "email_verifications_token_idx" ON "email_verifications"("token");
CREATE INDEX IF NOT EXISTS "email_verifications_user_id_idx" ON "email_verifications"("user_id");
CREATE INDEX IF NOT EXISTS "email_verifications_expires_at_idx" ON "email_verifications"("expires_at");

CREATE INDEX IF NOT EXISTS "import_logs_imported_by_idx" ON "import_logs"("imported_by");
CREATE INDEX IF NOT EXISTS "import_logs_started_at_idx" ON "import_logs"("started_at" DESC);
CREATE INDEX IF NOT EXISTS "import_logs_status_idx" ON "import_logs"("status");

CREATE INDEX IF NOT EXISTS "export_logs_exported_by_idx" ON "export_logs"("exported_by");
CREATE INDEX IF NOT EXISTS "export_logs_created_at_idx" ON "export_logs"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "export_logs_expires_at_idx" ON "export_logs"("expires_at");

-- Step 13: Add all foreign key constraints
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "departments" ADD CONSTRAINT "departments_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "departments" ADD CONSTRAINT "departments_deputy_manager_id_fkey" FOREIGN KEY ("deputy_manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "departments" ADD CONSTRAINT "departments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "departments" ADD CONSTRAINT "departments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "permissions" ADD CONSTRAINT "permissions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user_activity_logs" ADD CONSTRAINT "user_activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_impersonated_by_fkey" FOREIGN KEY ("impersonated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "password_history" ADD CONSTRAINT "password_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "password_history" ADD CONSTRAINT "password_history_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "import_logs" ADD CONSTRAINT "import_logs_imported_by_fkey" FOREIGN KEY ("imported_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "export_logs" ADD CONSTRAINT "export_logs_exported_by_fkey" FOREIGN KEY ("exported_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 14: Drop old columns after successful migration
ALTER TABLE "users" DROP COLUMN IF EXISTS "old_profile_picture";
ALTER TABLE "users" DROP COLUMN IF EXISTS "old_phone_number"; 
ALTER TABLE "users" DROP COLUMN IF EXISTS "old_department";
ALTER TABLE "users" DROP COLUMN IF EXISTS "password";

ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "resource";

-- Step 15: Drop old tables
DROP TABLE IF EXISTS "refresh_tokens";
DROP TABLE IF EXISTS "sessions";

-- Step 16: Insert initial permissions data
INSERT INTO "permissions" ("code", "name", "description", "category", "module", "risk_level", "min_access_level") VALUES
-- User management
('users.view', 'View Users', 'View user list and details', 'Users', 'users', 'LOW', 1),
('users.create', 'Create Users', 'Create new user accounts', 'Users', 'users', 'MEDIUM', 3),
('users.edit', 'Edit Users', 'Edit user information', 'Users', 'users', 'MEDIUM', 3),
('users.delete', 'Delete Users', 'Delete user accounts', 'Users', 'users', 'HIGH', 4),
('users.edit-access', 'Edit User Access', 'Change roles and permissions', 'Users', 'users', 'CRITICAL', 4),
('users.export', 'Export Users', 'Export user data', 'Users', 'users', 'MEDIUM', 3),
('users.import', 'Import Users', 'Bulk import users', 'Users', 'users', 'HIGH', 4),
('users.view-permissions', 'View User Permissions', 'View detailed permissions', 'Users', 'users', 'LOW', 2),
('users.manage-status', 'Manage User Status', 'Activate/suspend users', 'Users', 'users', 'HIGH', 3),

-- Audit
('audit.view', 'View Audit Logs', 'View system audit logs', 'Audit', 'audit', 'MEDIUM', 3),
('audit.export', 'Export Audit Logs', 'Export audit data', 'Audit', 'audit', 'HIGH', 4),

-- System
('system.config', 'System Configuration', 'Modify system settings', 'System', 'system', 'CRITICAL', 5),
('system.maintenance', 'System Maintenance', 'Perform maintenance tasks', 'System', 'system', 'CRITICAL', 5)
ON CONFLICT (code) DO NOTHING;

-- Step 17: Set password history expiration for existing users
INSERT INTO "password_history" ("user_id", "password_hash", "expires_at")
SELECT "id", "password_hash", NOW() + INTERVAL '2 years'
FROM "users"
WHERE "password_hash" IS NOT NULL;