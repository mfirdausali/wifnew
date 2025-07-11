# Users Management - Complete Database Schema

## Overview
This document provides the complete database schema for the Users Management feature, including all tables, indexes, constraints, triggers, views, and migration strategies.

## Table of Contents
1. [Users Table](#users-table)
2. [Permissions Table](#permissions-table)
3. [User Permissions Table](#user-permissions-table)
4. [Activity Logs Table](#activity-logs-table)
5. [Sessions Table](#sessions-table)
6. [Departments Table](#departments-table)
7. [Audit Logs Table](#audit-logs-table)
8. [Password History Table](#password-history-table)
9. [Email Verification Table](#email-verification-table)
10. [Supporting Tables](#supporting-tables)
11. [Indexes](#indexes)
12. [Constraints](#constraints)
13. [Triggers](#triggers)
14. [Views](#views)
15. [Functions and Procedures](#functions-and-procedures)

---

## 1. Users Table

### 1.1 Table Definition

```sql
CREATE TABLE users (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  email_normalized VARCHAR(255) NOT NULL, -- Lowercase for uniqueness
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  
  -- Personal information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  full_name VARCHAR(305) GENERATED ALWAYS AS (
    CASE 
      WHEN middle_name IS NOT NULL 
      THEN first_name || ' ' || middle_name || ' ' || last_name
      ELSE first_name || ' ' || last_name
    END
  ) STORED,
  initials VARCHAR(10) GENERATED ALWAYS AS (
    UPPER(LEFT(first_name, 1) || LEFT(last_name, 1))
  ) STORED,
  
  -- Professional information
  position VARCHAR(200),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  employment_date DATE DEFAULT CURRENT_DATE,
  employment_type VARCHAR(50) DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
  
  -- Authentication
  password_hash VARCHAR(255) NOT NULL,
  password_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  password_expires_at TIMESTAMP,
  require_password_change BOOLEAN DEFAULT TRUE,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  
  -- Access control
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'sales_manager', 'finance_manager', 'operations_manager')),
  access_level SMALLINT NOT NULL CHECK (access_level BETWEEN 1 AND 5),
  
  -- Contact information
  phone VARCHAR(20),
  phone_verified BOOLEAN DEFAULT FALSE,
  phone_country_code VARCHAR(5),
  phone_national VARCHAR(15),
  
  -- Profile
  avatar_url VARCHAR(500),
  avatar_thumbnail_url VARCHAR(500),
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(5) DEFAULT 'en',
  date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
  time_format VARCHAR(20) DEFAULT '24h',
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  status_reason TEXT,
  suspension_end_date TIMESTAMP,
  
  -- Activity tracking
  last_login_at TIMESTAMP,
  last_activity_at TIMESTAMP,
  last_password_change_at TIMESTAMP,
  login_count INTEGER DEFAULT 0,
  failed_login_count INTEGER DEFAULT 0,
  failed_login_last_at TIMESTAMP,
  
  -- Security
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  two_factor_backup_codes TEXT[], -- Array of encrypted backup codes
  security_questions JSONB, -- Encrypted Q&A pairs
  
  -- Preferences
  notification_preferences JSONB DEFAULT '{
    "email": true,
    "sms": false,
    "push": true,
    "desktop": true
  }'::jsonb,
  ui_preferences JSONB DEFAULT '{
    "theme": "light",
    "density": "normal",
    "sidebar_collapsed": false
  }'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Custom fields
  custom_fields JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  
  -- Constraints
  CONSTRAINT uk_users_email UNIQUE (email_normalized),
  CONSTRAINT uk_users_phone UNIQUE (phone_country_code, phone_national) WHERE phone IS NOT NULL,
  CONSTRAINT ck_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT ck_suspension_date CHECK (
    (status = 'suspended' AND suspension_end_date IS NOT NULL) OR 
    (status != 'suspended' AND suspension_end_date IS NULL)
  ),
  CONSTRAINT ck_manager_not_self CHECK (id != manager_id),
  CONSTRAINT ck_role_access_level CHECK (
    (role = 'admin' AND access_level >= 4) OR
    (role = 'sales_manager' AND access_level >= 2) OR
    (role = 'finance_manager' AND access_level >= 2) OR
    (role = 'operations_manager' AND access_level >= 2)
  )
);

-- Indexes
CREATE INDEX idx_users_email_normalized ON users(email_normalized) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_department ON users(department_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_manager ON users(manager_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login ON users(last_login_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_search ON users USING gin(
  to_tsvector('english', 
    coalesce(first_name, '') || ' ' || 
    coalesce(last_name, '') || ' ' || 
    coalesce(email, '') || ' ' ||
    coalesce(position, '') || ' ' ||
    coalesce(notes, '')
  )
) WHERE deleted_at IS NULL;

-- Full text search
ALTER TABLE users ADD COLUMN search_vector tsvector 
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(first_name, '') || ' ' ||
      coalesce(last_name, '') || ' ' ||
      coalesce(middle_name, '') || ' ' ||
      coalesce(email, '') || ' ' ||
      coalesce(position, '') || ' ' ||
      coalesce(notes, '')
    )
  ) STORED;

CREATE INDEX idx_users_search_vector ON users USING gin(search_vector);
```

### 1.2 Table Comments

```sql
COMMENT ON TABLE users IS 'Core users table storing all user accounts and profiles';
COMMENT ON COLUMN users.id IS 'Unique identifier for the user';
COMMENT ON COLUMN users.email IS 'User email address (case-preserving)';
COMMENT ON COLUMN users.email_normalized IS 'Lowercase email for unique constraint';
COMMENT ON COLUMN users.full_name IS 'Computed full name from first, middle, last';
COMMENT ON COLUMN users.access_level IS 'Access level 1-5: 1=Basic, 2=Standard, 3=Enhanced, 4=Manager, 5=Executive';
COMMENT ON COLUMN users.custom_fields IS 'Flexible JSON storage for client-specific fields';
COMMENT ON COLUMN users.search_vector IS 'Full-text search vector for fast searching';
```

---

## 2. Permissions Table

### 2.1 Table Definition

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  module VARCHAR(100),
  
  -- Permission hierarchy
  parent_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 0,
  path VARCHAR(500), -- Materialized path for hierarchy queries
  
  -- Risk and requirements
  risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  requires_2fa BOOLEAN DEFAULT FALSE,
  requires_approval BOOLEAN DEFAULT FALSE,
  
  -- Role associations
  default_for_roles TEXT[] DEFAULT '{}',
  excluded_from_roles TEXT[] DEFAULT '{}',
  
  -- Access level requirements
  min_access_level SMALLINT DEFAULT 1 CHECK (min_access_level BETWEEN 1 AND 5),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT FALSE, -- Cannot be deleted
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT ck_parent_not_self CHECK (id != parent_id)
);

-- Sample permissions data
INSERT INTO permissions (code, name, description, category, module, risk_level, min_access_level) VALUES
-- User management
('users.view', 'View Users', 'View user list and details', 'Users', 'users', 'low', 1),
('users.create', 'Create Users', 'Create new user accounts', 'Users', 'users', 'medium', 3),
('users.edit', 'Edit Users', 'Edit user information', 'Users', 'users', 'medium', 3),
('users.delete', 'Delete Users', 'Delete user accounts', 'Users', 'users', 'high', 4),
('users.edit-access', 'Edit User Access', 'Change roles and permissions', 'Users', 'users', 'critical', 4),
('users.export', 'Export Users', 'Export user data', 'Users', 'users', 'medium', 3),
('users.import', 'Import Users', 'Bulk import users', 'Users', 'users', 'high', 4),
('users.view-permissions', 'View User Permissions', 'View detailed permissions', 'Users', 'users', 'low', 2),
('users.manage-status', 'Manage User Status', 'Activate/suspend users', 'Users', 'users', 'high', 3),

-- Audit
('audit.view', 'View Audit Logs', 'View system audit logs', 'Audit', 'audit', 'medium', 3),
('audit.export', 'Export Audit Logs', 'Export audit data', 'Audit', 'audit', 'high', 4),

-- System
('system.config', 'System Configuration', 'Modify system settings', 'System', 'system', 'critical', 5),
('system.maintenance', 'System Maintenance', 'Perform maintenance tasks', 'System', 'system', 'critical', 5);

-- Indexes
CREATE INDEX idx_permissions_category ON permissions(category);
CREATE INDEX idx_permissions_module ON permissions(module);
CREATE INDEX idx_permissions_parent ON permissions(parent_id);
CREATE INDEX idx_permissions_path ON permissions(path);
```

---

## 3. User Permissions Table

### 3.1 Table Definition

```sql
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  
  -- Grant details
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  grant_reason TEXT,
  
  -- Expiration
  expires_at TIMESTAMP,
  
  -- Delegation
  can_delegate BOOLEAN DEFAULT FALSE,
  delegation_limit INTEGER DEFAULT 0, -- How many times can be delegated
  
  -- Conditions
  conditions JSONB, -- Additional conditions for the permission
  
  -- Revocation
  revoked_at TIMESTAMP,
  revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  revoke_reason TEXT,
  
  -- Unique constraint
  CONSTRAINT uk_user_permission UNIQUE (user_id, permission_id),
  
  -- Check constraints
  CONSTRAINT ck_not_expired_if_not_revoked CHECK (
    revoked_at IS NOT NULL OR expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP
  )
);

-- Indexes
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_user_permissions_permission ON user_permissions(permission_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_user_permissions_expires ON user_permissions(expires_at) WHERE revoked_at IS NULL AND expires_at IS NOT NULL;
CREATE INDEX idx_user_permissions_granted_by ON user_permissions(granted_by);
```

---

## 4. Activity Logs Table

### 4.1 Table Definition

```sql
CREATE TABLE user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Activity details
  action VARCHAR(100) NOT NULL,
  action_category VARCHAR(50),
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  resource_name VARCHAR(500),
  
  -- Request details
  method VARCHAR(10),
  path VARCHAR(500),
  query_params JSONB,
  request_body JSONB, -- Sanitized, no passwords
  response_status INTEGER,
  response_time_ms INTEGER,
  
  -- Context
  ip_address INET,
  ip_location JSONB, -- GeoIP data
  user_agent TEXT,
  device_info JSONB,
  session_id UUID,
  
  -- Additional data
  details JSONB,
  error_message TEXT,
  stack_trace TEXT,
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Partitioning key
  created_date DATE GENERATED ALWAYS AS (DATE(created_at)) STORED
) PARTITION BY RANGE (created_date);

-- Create partitions for the last 12 months and next 3 months
DO $$
DECLARE
  start_date date := date_trunc('month', CURRENT_DATE - interval '12 months');
  end_date date := date_trunc('month', CURRENT_DATE + interval '3 months');
  partition_date date;
  partition_name text;
BEGIN
  partition_date := start_date;
  
  WHILE partition_date <= end_date LOOP
    partition_name := 'user_activity_logs_' || to_char(partition_date, 'YYYY_MM');
    
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF user_activity_logs
       FOR VALUES FROM (%L) TO (%L)',
      partition_name,
      partition_date,
      partition_date + interval '1 month'
    );
    
    -- Create indexes on partition
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_%I_user_id ON %I(user_id)',
      partition_name, partition_name
    );
    
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_%I_created_at ON %I(created_at)',
      partition_name, partition_name
    );
    
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_%I_action ON %I(action)',
      partition_name, partition_name
    );
    
    partition_date := partition_date + interval '1 month';
  END LOOP;
END $$;

-- Indexes on parent table
CREATE INDEX idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX idx_user_activity_logs_action ON user_activity_logs(action);
CREATE INDEX idx_user_activity_logs_resource ON user_activity_logs(resource_type, resource_id);
CREATE INDEX idx_user_activity_logs_ip ON user_activity_logs(ip_address);
CREATE INDEX idx_user_activity_logs_session ON user_activity_logs(session_id);
```

---

## 5. Sessions Table

### 5.1 Table Definition

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session tokens
  access_token_hash VARCHAR(255) NOT NULL UNIQUE,
  refresh_token_hash VARCHAR(255) UNIQUE,
  
  -- Session details
  ip_address INET NOT NULL,
  user_agent TEXT,
  device_id VARCHAR(255),
  device_info JSONB,
  
  -- Location
  country_code VARCHAR(2),
  region VARCHAR(100),
  city VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  revoked_at TIMESTAMP,
  revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  revoke_reason VARCHAR(100),
  
  -- Security
  security_flags TEXT[] DEFAULT '{}', -- suspicious, verified, etc.
  risk_score DECIMAL(3, 2) DEFAULT 0.00 CHECK (risk_score BETWEEN 0 AND 1),
  
  -- Constraints
  CONSTRAINT ck_session_expiry CHECK (expires_at > created_at),
  CONSTRAINT ck_session_revoked CHECK (
    (is_active = FALSE AND revoked_at IS NOT NULL) OR
    (is_active = TRUE AND revoked_at IS NULL)
  )
);

-- Indexes
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_sessions_access_token ON user_sessions(access_token_hash) WHERE is_active = TRUE;
CREATE INDEX idx_sessions_refresh_token ON user_sessions(refresh_token_hash) WHERE is_active = TRUE;
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at) WHERE is_active = TRUE;
CREATE INDEX idx_sessions_device_id ON user_sessions(device_id) WHERE is_active = TRUE;
CREATE INDEX idx_sessions_ip_address ON user_sessions(ip_address);
```

---

## 6. Departments Table

### 6.1 Table Definition

```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Hierarchy
  parent_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 0,
  path VARCHAR(500), -- Materialized path: /root/parent/current/
  sort_order INTEGER DEFAULT 0,
  
  -- Manager
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  deputy_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Contact
  email VARCHAR(255),
  phone VARCHAR(20),
  location VARCHAR(500),
  
  -- Budget
  budget_code VARCHAR(50),
  cost_center VARCHAR(50),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Custom fields
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT ck_department_parent_not_self CHECK (id != parent_id)
);

-- Indexes
CREATE INDEX idx_departments_code ON departments(code);
CREATE INDEX idx_departments_parent ON departments(parent_id);
CREATE INDEX idx_departments_path ON departments(path);
CREATE INDEX idx_departments_manager ON departments(manager_id);

-- Recursive view for department hierarchy
CREATE OR REPLACE VIEW department_hierarchy AS
WITH RECURSIVE dept_tree AS (
  -- Anchor: root departments
  SELECT 
    d.*,
    d.name AS full_path,
    ARRAY[d.id] AS path_ids,
    0 AS depth
  FROM departments d
  WHERE d.parent_id IS NULL
  
  UNION ALL
  
  -- Recursive: child departments
  SELECT 
    d.*,
    dt.full_path || ' > ' || d.name AS full_path,
    dt.path_ids || d.id AS path_ids,
    dt.depth + 1 AS depth
  FROM departments d
  INNER JOIN dept_tree dt ON d.parent_id = dt.id
)
SELECT * FROM dept_tree;
```

---

## 7. Audit Logs Table

### 7.1 Table Definition

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255), -- Denormalized for history
  user_name VARCHAR(305), -- Denormalized for history
  impersonated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Target
  target_type VARCHAR(100) NOT NULL, -- users, permissions, etc.
  target_id VARCHAR(255),
  target_name VARCHAR(500),
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Action
  action VARCHAR(100) NOT NULL,
  action_category VARCHAR(50) NOT NULL,
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  request_id VARCHAR(100),
  
  -- Additional details
  details JSONB,
  reason TEXT,
  
  -- Result
  success BOOLEAN DEFAULT TRUE,
  error_code VARCHAR(100),
  error_message TEXT,
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Compliance
  retention_days INTEGER DEFAULT 2555, -- 7 years default
  expires_at TIMESTAMP GENERATED ALWAYS AS (
    created_at + (retention_days || ' days')::interval
  ) STORED
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_target_user ON audit_logs(target_user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_ip_address ON audit_logs(ip_address);

-- Partitioning by month for better performance
-- Similar to activity logs partitioning
```

---

## 8. Password History Table

### 8.1 Table Definition

```sql
CREATE TABLE password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Password hash (for checking reuse)
  password_hash VARCHAR(255) NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Change details
  change_reason VARCHAR(100), -- reset, expired, user_change, admin_reset
  change_ip INET,
  change_user_agent TEXT,
  
  -- Cleanup
  expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '2 years')
);

-- Indexes
CREATE INDEX idx_password_history_user_id ON password_history(user_id);
CREATE INDEX idx_password_history_created_at ON password_history(created_at DESC);
CREATE INDEX idx_password_history_expires_at ON password_history(expires_at);

-- Ensure we keep only last N passwords per user
CREATE OR REPLACE FUNCTION limit_password_history() RETURNS TRIGGER AS $$
DECLARE
  max_history_count INTEGER := 24; -- Keep last 24 passwords
BEGIN
  DELETE FROM password_history
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id FROM password_history
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT max_history_count - 1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_limit_password_history
AFTER INSERT ON password_history
FOR EACH ROW
EXECUTE FUNCTION limit_password_history();
```

---

## 9. Email Verification Table

### 9.1 Table Definition

```sql
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Email details
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  
  -- Type
  type VARCHAR(50) NOT NULL CHECK (type IN ('signup', 'change', 'recovery')),
  
  -- Status
  verified_at TIMESTAMP,
  
  -- Expiration
  expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
  
  -- Tracking
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_count INTEGER DEFAULT 1,
  last_sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Verification details
  verified_ip INET,
  verified_user_agent TEXT,
  
  -- Constraints
  CONSTRAINT ck_email_verification_expiry CHECK (expires_at > sent_at)
);

-- Indexes
CREATE INDEX idx_email_verifications_token ON email_verifications(token) WHERE verified_at IS NULL;
CREATE INDEX idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX idx_email_verifications_expires_at ON email_verifications(expires_at) WHERE verified_at IS NULL;
```

---

## 10. Supporting Tables

### 10.1 Import Logs Table

```sql
CREATE TABLE import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Import details
  filename VARCHAR(500) NOT NULL,
  file_size BIGINT,
  file_hash VARCHAR(64),
  format VARCHAR(20) NOT NULL,
  
  -- Processing
  total_rows INTEGER NOT NULL,
  processed_rows INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  skip_count INTEGER DEFAULT 0,
  
  -- Results
  results JSONB,
  errors JSONB,
  
  -- Metadata
  imported_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'cancelled'))
);

-- Indexes
CREATE INDEX idx_import_logs_imported_by ON import_logs(imported_by);
CREATE INDEX idx_import_logs_started_at ON import_logs(started_at DESC);
CREATE INDEX idx_import_logs_status ON import_logs(status);
```

### 10.2 Export Logs Table

```sql
CREATE TABLE export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Export details
  format VARCHAR(20) NOT NULL,
  filters JSONB,
  fields TEXT[],
  
  -- Results
  row_count INTEGER,
  file_size BIGINT,
  file_url VARCHAR(500),
  
  -- Metadata
  exported_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  
  -- Access tracking
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_export_logs_exported_by ON export_logs(exported_by);
CREATE INDEX idx_export_logs_created_at ON export_logs(created_at DESC);
CREATE INDEX idx_export_logs_expires_at ON export_logs(expires_at);
```

---

## 11. Indexes

### 11.1 Performance Indexes Summary

```sql
-- Composite indexes for common queries
CREATE INDEX idx_users_dept_role_status ON users(department_id, role, status) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_users_role_access_level ON users(role, access_level) 
  WHERE deleted_at IS NULL AND status = 'active';

CREATE INDEX idx_activity_user_date_action ON user_activity_logs(user_id, created_at DESC, action);

CREATE INDEX idx_audit_user_date ON audit_logs(user_id, created_at DESC);

-- Covering indexes for list queries
CREATE INDEX idx_users_list_covering ON users(
  created_at DESC,
  id,
  email,
  first_name,
  last_name,
  role,
  department_id,
  status
) WHERE deleted_at IS NULL;

-- Partial indexes for filtered queries
CREATE INDEX idx_users_active_admins ON users(id) 
  WHERE deleted_at IS NULL AND status = 'active' AND role = 'admin';

CREATE INDEX idx_users_suspended ON users(id, suspension_end_date) 
  WHERE deleted_at IS NULL AND status = 'suspended';

-- Expression indexes
CREATE INDEX idx_users_email_domain ON users(
  split_part(email, '@', 2)
) WHERE deleted_at IS NULL;

CREATE INDEX idx_users_name_initials ON users(
  LEFT(first_name, 1),
  LEFT(last_name, 1)
) WHERE deleted_at IS NULL;
```

---

## 12. Constraints

### 12.1 Foreign Key Constraints

```sql
-- Ensure referential integrity with proper cascading
ALTER TABLE users
  ADD CONSTRAINT fk_users_created_by_valid 
  FOREIGN KEY (created_by) REFERENCES users(id) 
  ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE users
  ADD CONSTRAINT fk_users_manager_active
  FOREIGN KEY (manager_id) REFERENCES users(id)
  ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;

-- Check constraints
ALTER TABLE users
  ADD CONSTRAINT ck_users_valid_dates CHECK (
    created_at <= updated_at AND
    (deleted_at IS NULL OR deleted_at >= updated_at)
  );

ALTER TABLE users
  ADD CONSTRAINT ck_users_password_expiry CHECK (
    password_expires_at IS NULL OR 
    password_expires_at > password_changed_at
  );

-- Domain constraints
CREATE DOMAIN email_address AS VARCHAR(255)
  CHECK (VALUE ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

CREATE DOMAIN phone_number AS VARCHAR(20)
  CHECK (VALUE ~ '^\+?[1-9]\d{1,14}$');
```

---

## 13. Triggers

### 13.1 Update Timestamp Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 13.2 Email Normalization Trigger

```sql
CREATE OR REPLACE FUNCTION normalize_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_normalized = LOWER(TRIM(NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_user_email
  BEFORE INSERT OR UPDATE OF email ON users
  FOR EACH ROW
  EXECUTE FUNCTION normalize_email();
```

### 13.3 Department Path Trigger

```sql
CREATE OR REPLACE FUNCTION update_department_path()
RETURNS TRIGGER AS $$
DECLARE
  parent_path VARCHAR(500);
  parent_level INTEGER;
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.path = '/' || NEW.id || '/';
    NEW.level = 0;
  ELSE
    SELECT path, level INTO parent_path, parent_level
    FROM departments WHERE id = NEW.parent_id;
    
    NEW.path = parent_path || NEW.id || '/';
    NEW.level = parent_level + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_department_path_trigger
  BEFORE INSERT OR UPDATE OF parent_id ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_department_path();
```

### 13.4 Audit Log Trigger

```sql
CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields TEXT[];
  old_values JSONB;
  new_values JSONB;
BEGIN
  -- Determine changed fields
  changed_fields := ARRAY[]::TEXT[];
  old_values := '{}'::JSONB;
  new_values := '{}'::JSONB;
  
  -- Check each auditable field
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    changed_fields := array_append(changed_fields, 'email');
    old_values := jsonb_set(old_values, '{email}', to_jsonb(OLD.email));
    new_values := jsonb_set(new_values, '{email}', to_jsonb(NEW.email));
  END IF;
  
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    changed_fields := array_append(changed_fields, 'role');
    old_values := jsonb_set(old_values, '{role}', to_jsonb(OLD.role));
    new_values := jsonb_set(new_values, '{role}', to_jsonb(NEW.role));
  END IF;
  
  IF OLD.access_level IS DISTINCT FROM NEW.access_level THEN
    changed_fields := array_append(changed_fields, 'access_level');
    old_values := jsonb_set(old_values, '{access_level}', to_jsonb(OLD.access_level));
    new_values := jsonb_set(new_values, '{access_level}', to_jsonb(NEW.access_level));
  END IF;
  
  -- Add more fields as needed...
  
  -- Create audit log if there are changes
  IF array_length(changed_fields, 1) > 0 THEN
    INSERT INTO audit_logs (
      user_id,
      target_type,
      target_id,
      target_user_id,
      action,
      action_category,
      old_values,
      new_values,
      changed_fields
    ) VALUES (
      NEW.updated_by,
      'users',
      NEW.id,
      NEW.id,
      'USER_UPDATED',
      'users',
      old_values,
      new_values,
      changed_fields
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_user_changes_trigger
  AFTER UPDATE ON users
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION audit_user_changes();
```

### 13.5 Password History Trigger

```sql
CREATE OR REPLACE FUNCTION record_password_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.password_hash IS DISTINCT FROM NEW.password_hash THEN
    INSERT INTO password_history (
      user_id,
      password_hash,
      created_by,
      change_reason
    ) VALUES (
      NEW.id,
      NEW.password_hash,
      NEW.updated_by,
      CASE
        WHEN NEW.require_password_change THEN 'admin_reset'
        WHEN NEW.password_expires_at < CURRENT_TIMESTAMP THEN 'expired'
        ELSE 'user_change'
      END
    );
    
    -- Update password timestamps
    NEW.password_changed_at = CURRENT_TIMESTAMP;
    NEW.last_password_change_at = CURRENT_TIMESTAMP;
    
    -- Set new expiration
    IF NEW.password_expires_at IS NOT NULL THEN
      NEW.password_expires_at = CURRENT_TIMESTAMP + INTERVAL '90 days';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER record_password_change_trigger
  BEFORE UPDATE OF password_hash ON users
  FOR EACH ROW
  EXECUTE FUNCTION record_password_change();
```

---

## 14. Views

### 14.1 Active Users View

```sql
CREATE OR REPLACE VIEW active_users AS
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.full_name,
  u.position,
  u.role,
  u.access_level,
  u.department_id,
  d.name AS department_name,
  u.manager_id,
  m.full_name AS manager_name,
  u.last_login_at,
  u.created_at,
  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - u.last_activity_at)) / 60 AS minutes_since_activity,
  u.login_count,
  CASE 
    WHEN u.last_activity_at > CURRENT_TIMESTAMP - INTERVAL '5 minutes' THEN TRUE
    ELSE FALSE
  END AS is_online
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN users m ON u.manager_id = m.id
WHERE u.deleted_at IS NULL
  AND u.status = 'active';
```

### 14.2 User Permissions View

```sql
CREATE OR REPLACE VIEW user_permissions_expanded AS
SELECT 
  u.id AS user_id,
  u.email,
  u.full_name,
  u.role,
  u.access_level,
  p.code AS permission_code,
  p.name AS permission_name,
  p.category AS permission_category,
  CASE 
    WHEN up.id IS NOT NULL THEN 'direct'
    WHEN p.code = ANY(
      SELECT unnest(default_for_roles) 
      FROM permissions 
      WHERE u.role = ANY(default_for_roles)
    ) THEN 'role'
    ELSE 'inherited'
  END AS permission_source,
  up.granted_at,
  up.granted_by,
  up.expires_at,
  CASE
    WHEN up.expires_at IS NOT NULL AND up.expires_at < CURRENT_TIMESTAMP THEN TRUE
    ELSE FALSE
  END AS is_expired
FROM users u
CROSS JOIN permissions p
LEFT JOIN user_permissions up ON u.id = up.user_id AND p.id = up.permission_id
WHERE u.deleted_at IS NULL
  AND u.status = 'active'
  AND p.is_active = TRUE
  AND (
    -- Direct permission
    up.id IS NOT NULL AND up.revoked_at IS NULL
    OR
    -- Role-based permission
    u.role = ANY(p.default_for_roles)
    OR
    -- Access level permission
    u.access_level >= p.min_access_level
  );
```

### 14.3 Department Statistics View

```sql
CREATE OR REPLACE VIEW department_statistics AS
SELECT 
  d.id,
  d.name,
  d.level,
  COUNT(DISTINCT u.id) AS user_count,
  COUNT(DISTINCT u.id) FILTER (WHERE u.status = 'active') AS active_user_count,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'admin') AS admin_count,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'sales_manager') AS sales_manager_count,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'finance_manager') AS finance_manager_count,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'operations_manager') AS operations_manager_count,
  AVG(u.access_level) AS avg_access_level,
  MAX(u.last_login_at) AS last_department_login
FROM departments d
LEFT JOIN users u ON d.id = u.department_id AND u.deleted_at IS NULL
GROUP BY d.id, d.name, d.level;
```

---

## 15. Functions and Procedures

### 15.1 User Search Function

```sql
CREATE OR REPLACE FUNCTION search_users(
  search_term TEXT,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  email VARCHAR(255),
  full_name VARCHAR(305),
  position VARCHAR(200),
  department_name VARCHAR(200),
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.position,
    d.name AS department_name,
    ts_rank(u.search_vector, query) AS rank
  FROM users u
  LEFT JOIN departments d ON u.department_id = d.id
  CROSS JOIN plainto_tsquery('english', search_term) AS query
  WHERE u.deleted_at IS NULL
    AND u.search_vector @@ query
  ORDER BY rank DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

### 15.2 Check User Permissions Function

```sql
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_permission_code VARCHAR(100)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN;
  v_user_role VARCHAR(50);
  v_user_access_level SMALLINT;
  v_permission_id UUID;
  v_min_access_level SMALLINT;
  v_default_roles TEXT[];
BEGIN
  -- Get user details
  SELECT role, access_level INTO v_user_role, v_user_access_level
  FROM users
  WHERE id = p_user_id AND deleted_at IS NULL AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Get permission details
  SELECT id, min_access_level, default_for_roles 
  INTO v_permission_id, v_min_access_level, v_default_roles
  FROM permissions
  WHERE code = p_permission_code AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check direct permission
  SELECT EXISTS(
    SELECT 1 FROM user_permissions
    WHERE user_id = p_user_id 
      AND permission_id = v_permission_id
      AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
  ) INTO v_has_permission;
  
  IF v_has_permission THEN
    RETURN TRUE;
  END IF;
  
  -- Check role-based permission
  IF v_user_role = ANY(v_default_roles) THEN
    RETURN TRUE;
  END IF;
  
  -- Check access level permission
  IF v_user_access_level >= v_min_access_level THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
```

### 15.3 Cleanup Procedures

```sql
-- Cleanup expired sessions
CREATE OR REPLACE PROCEDURE cleanup_expired_sessions()
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE user_sessions
  SET is_active = FALSE,
      revoked_at = CURRENT_TIMESTAMP,
      revoke_reason = 'expired'
  WHERE is_active = TRUE
    AND expires_at < CURRENT_TIMESTAMP;
    
  -- Delete very old sessions
  DELETE FROM user_sessions
  WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
END;
$$;

-- Cleanup old activity logs
CREATE OR REPLACE PROCEDURE cleanup_old_activity_logs()
LANGUAGE plpgsql
AS $$
DECLARE
  cutoff_date DATE;
BEGIN
  -- Keep 90 days of activity logs
  cutoff_date := CURRENT_DATE - INTERVAL '90 days';
  
  -- Drop old partitions
  FOR partition_name IN
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename LIKE 'user_activity_logs_%'
      AND tablename < 'user_activity_logs_' || to_char(cutoff_date, 'YYYY_MM')
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', partition_name);
  END LOOP;
END;
$$;

-- Schedule cleanup jobs
-- Run these with pg_cron or similar scheduler
-- SELECT cron.schedule('cleanup-sessions', '0 * * * *', 'CALL cleanup_expired_sessions()');
-- SELECT cron.schedule('cleanup-activity-logs', '0 2 * * *', 'CALL cleanup_old_activity_logs()');
```

---

## Migration Strategy

### Initial Migration

```sql
-- Migration: 001_create_users_management_schema.sql

BEGIN;

-- Create all tables in order
-- 1. Create departments first (no dependencies)
CREATE TABLE departments...

-- 2. Create users (depends on departments)
CREATE TABLE users...

-- 3. Create permissions
CREATE TABLE permissions...

-- 4. Create junction and dependent tables
CREATE TABLE user_permissions...
CREATE TABLE user_activity_logs...
CREATE TABLE user_sessions...
CREATE TABLE audit_logs...
CREATE TABLE password_history...
CREATE TABLE email_verifications...

-- 5. Create indexes
CREATE INDEX...

-- 6. Create triggers
CREATE TRIGGER...

-- 7. Create views
CREATE VIEW...

-- 8. Create functions
CREATE FUNCTION...

-- 9. Insert initial data
INSERT INTO departments (code, name) VALUES
  ('ADMIN', 'Administration'),
  ('SALES', 'Sales'),
  ('FINANCE', 'Finance'),
  ('OPS', 'Operations');

INSERT INTO permissions...

-- 10. Create initial admin user
INSERT INTO users (
  email,
  email_normalized,
  first_name,
  last_name,
  password_hash,
  role,
  access_level,
  status,
  email_verified,
  require_password_change
) VALUES (
  'admin@company.com',
  'admin@company.com',
  'System',
  'Administrator',
  '$2b$12$...', -- Pre-hashed password
  'admin',
  5,
  'active',
  TRUE,
  TRUE
);

COMMIT;
```

### Rollback Strategy

```sql
-- Rollback: 001_create_users_management_schema.sql

BEGIN;

-- Drop views first
DROP VIEW IF EXISTS active_users CASCADE;
DROP VIEW IF EXISTS user_permissions_expanded CASCADE;
DROP VIEW IF EXISTS department_statistics CASCADE;
DROP VIEW IF EXISTS department_hierarchy CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS search_users CASCADE;
DROP FUNCTION IF EXISTS user_has_permission CASCADE;
DROP PROCEDURE IF EXISTS cleanup_expired_sessions CASCADE;
DROP PROCEDURE IF EXISTS cleanup_old_activity_logs CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
-- ... other triggers

-- Drop tables in reverse order
DROP TABLE IF EXISTS email_verifications CASCADE;
DROP TABLE IF EXISTS password_history CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_activity_logs CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

COMMIT;
```

## Performance Considerations

1. **Partitioning**: Activity logs and audit logs are partitioned by month
2. **Indexes**: Covering indexes for common queries
3. **Materialized Views**: Consider for complex permission calculations
4. **Connection Pooling**: Use PgBouncer for high-traffic scenarios
5. **Read Replicas**: Separate read traffic for reports
6. **Archival**: Move old audit logs to cold storage

## Security Considerations

1. **Row Level Security**: Implement RLS for multi-tenant scenarios
2. **Encryption**: Encrypt sensitive columns at rest
3. **Audit Trail**: Complete audit trail for compliance
4. **Data Masking**: Implement dynamic data masking for sensitive fields
5. **Backup Strategy**: Point-in-time recovery with continuous archiving