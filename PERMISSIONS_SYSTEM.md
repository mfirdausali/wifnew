# Permission and Access Control System

## Overview

This application implements a comprehensive permission and access control system that provides fine-grained control over user access to various features and resources.

## Key Features

### 1. Permission-Based Access Control
- **Fine-grained permissions**: Each action has a specific permission code
- **Hierarchical permissions**: Parent permissions can grant access to child permissions
- **Permission inheritance**: Users inherit permissions from their roles
- **Direct permission assignment**: Override role permissions for specific users

### 2. Advanced Security Features
- **Risk levels**: Permissions are categorized by risk (LOW, MEDIUM, HIGH, CRITICAL)
- **2FA requirements**: High-risk permissions can require two-factor authentication
- **Approval workflows**: Critical permissions can require approval
- **Access level requirements**: Minimum access levels for sensitive operations
- **Temporary permissions**: Grant time-limited access

### 3. Permission Management UI
- **Visual permission tree**: Browse permissions in a hierarchical structure
- **User permission management**: Grant/revoke permissions per user
- **Audit trail**: Complete history of permission changes
- **Expired permission cleanup**: Automatic handling of expired permissions

## Implementation

### Backend Components

#### 1. Permission Middleware (`backend/src/middleware/permission.middleware.ts`)
```typescript
// Basic permission check
router.get('/resource', requirePermissions('resource.view'));

// Multiple permissions (AND logic)
router.post('/resource', requirePermissions('resource.create', 'resource.manage'));

// Any permission (OR logic)
router.get('/data', checkPermissions(['data.view', 'data.admin'], { requireAny: true }));

// With access level check
router.delete('/resource', checkPermissions(['resource.delete'], {
  minAccessLevel: 4,
  require2fa: true
}));

// Department-based permissions
router.put('/department/:id', checkDepartmentPermission('manage'));
```

#### 2. Permission Service (`backend/src/services/permission.service.ts`)
- `getUserPermissions(userId)`: Get all permissions for a user
- `hasPermission(userId, permissionCode)`: Check if user has permission
- `grantPermissions(userId, permissions, grantedBy)`: Grant permissions
- `revokePermissions(userId, permissions, revokedBy)`: Revoke permissions
- `grantTemporaryPermission(userId, permission, hours)`: Grant temporary access
- `getEffectivePermissions(userId)`: Get permissions including inherited

#### 3. Database Schema
```prisma
model Permission {
  id                  String              @id @default(uuid())
  code                String              @unique
  name                String
  description         String?
  category            String
  module              String?
  parentId            String?             // Hierarchical structure
  riskLevel           PermissionRiskLevel @default(LOW)
  requires2fa         Boolean             @default(false)
  requiresApproval    Boolean             @default(false)
  defaultForRoles     String[]            // Roles that get this by default
  minAccessLevel      Int                 @default(1)
}

model UserPermission {
  id                  String      @id @default(uuid())
  userId              String
  permissionId        String
  grantedBy           String?
  grantedAt           DateTime
  expiresAt           DateTime?   // For temporary permissions
  revokedAt           DateTime?
  revokedBy           String?
}
```

### Frontend Components

#### 1. Permission Check Hook (`frontend/src/hooks/usePermissionCheck.ts`)
```typescript
const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissionCheck();

// Check single permission
if (hasPermission('users.create')) {
  // Show create button
}

// Check multiple permissions
if (hasAllPermissions(['users.view', 'users.update'])) {
  // Show edit interface
}
```

#### 2. Permission Guards (`frontend/src/components/guards/PermissionGuard.tsx`)
```tsx
// Protect components
<PermissionGuard permissions="admin.access">
  <AdminPanel />
</PermissionGuard>

// With fallback
<PermissionGuard 
  permissions={['users.delete']} 
  fallback={<AccessDenied />}
>
  <DeleteButton />
</PermissionGuard>

// Conditional rendering
<CanAccess permissions="reports.view">
  <ReportsMenu />
</CanAccess>
```

#### 3. Permission Management UI
- **PermissionManager**: Main component for managing permissions
- **PermissionTree**: Visual hierarchy of all permissions
- **UserPermissions**: Assign/revoke permissions for users
- **PermissionAuditLog**: View history of permission changes
- **ExpiredPermissions**: Manage expired temporary permissions

## Permission Categories

### User Management
- `users.view`: View user list and details
- `users.create`: Create new users
- `users.update`: Update user information
- `users.delete`: Delete users (requires 2FA)
- `users.bulk_update`: Bulk operations (requires 2FA)
- `users.export`: Export user data
- `users.import`: Import users (requires 2FA)

### Permission Management
- `permission.view`: View permissions
- `permission.grant`: Grant permissions (requires 2FA + approval)
- `permission.revoke`: Revoke permissions (requires 2FA)
- `permission.grant_temporary`: Grant temporary permissions
- `permission.audit`: View permission audit logs
- `permission.manage`: Create/update/delete permissions (requires 2FA)

### Department Management
- `department.view`: View departments
- `department.edit`: Edit department info
- `department.manage`: Create/delete departments

### Sales
- `sales.view`: View sales data
- `sales.manage_customers`: Manage customers
- `sales.manage_orders`: Manage orders

### Finance
- `finance.view`: View financial data
- `finance.manage_transactions`: Manage transactions (requires 2FA)
- `finance.approve_expenses`: Approve expenses

### Operations
- `operations.view`: View operations data
- `operations.manage_orders`: Manage order fulfillment
- `operations.manage_inventory`: Manage inventory

### System
- `system.view_audit`: View system audit logs
- `system.config`: System configuration (requires 2FA + approval)
- `system.backup`: System backup operations (requires 2FA)

## Usage Examples

### 1. Protect API Endpoints
```typescript
// Simple permission check
router.get('/users', 
  authenticate,
  requirePermissions('users.view'),
  UserController.list
);

// Complex permission requirements
router.delete('/users/:id',
  authenticate,
  checkPermissions(['users.delete'], {
    require2fa: true,
    minAccessLevel: 4,
    customCheck: async (req) => {
      // Can't delete yourself
      return req.params.id !== req.user.id;
    }
  }),
  UserController.delete
);
```

### 2. Frontend Permission Checks
```tsx
function UserManagement() {
  const { hasPermission } = usePermissionCheck();
  
  return (
    <div>
      <h1>User Management</h1>
      
      {hasPermission('users.create') && (
        <Button onClick={handleCreate}>Create User</Button>
      )}
      
      <PermissionGuard permissions="users.view">
        <UserList />
      </PermissionGuard>
    </div>
  );
}
```

### 3. Temporary Permission Grant
```typescript
// Grant 24-hour access to view financial reports
await PermissionService.grantTemporaryPermission(
  userId,
  'finance.view',
  grantedBy,
  24 // hours
);
```

## Security Best Practices

1. **Principle of Least Privilege**: Users should only have permissions they need
2. **Regular Audits**: Review permission assignments regularly
3. **Temporary Access**: Use temporary permissions for short-term needs
4. **2FA for Critical Operations**: Enable 2FA for high-risk permissions
5. **Approval Workflows**: Require approval for critical permission grants
6. **Audit Trail**: Keep complete logs of all permission changes

## Database Seeding

To populate default permissions:
```bash
npm run seed:permissions
```

This will create all default permissions with appropriate risk levels and role assignments.

## API Endpoints

### Permission Management
- `GET /api/permissions` - List all permissions
- `GET /api/permissions/hierarchy` - Get permission tree
- `GET /api/permissions/users/:userId` - Get user permissions
- `POST /api/permissions/users/:userId/grant` - Grant permissions
- `POST /api/permissions/users/:userId/revoke` - Revoke permissions
- `POST /api/permissions/users/:userId/grant-temporary` - Grant temporary
- `GET /api/permissions/users/:userId/audit` - View audit log
- `POST /api/permissions/clone` - Clone permissions between users

### Permission Administration
- `POST /api/permissions` - Create new permission
- `PUT /api/permissions/:id` - Update permission
- `DELETE /api/permissions/:id` - Delete permission
- `GET /api/permissions/expired` - View expired permissions
- `POST /api/permissions/expired/cleanup` - Cleanup expired