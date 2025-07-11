# Module Access Control Integration Guide

## Overview
This guide explains how to integrate new modules with the existing role-based access control (RBAC) system combined with access levels (1-5).

## Core Access Control Structure

### 1. Module Registration System

```typescript
// modules/registry.ts
interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  targetRoles: Role[]; // Which roles can access this module
  minimumAccessLevel: number; // Minimum level required (1-5)
  permissions: ModulePermission[];
}

interface ModulePermission {
  action: string; // 'view', 'create', 'edit', 'delete', 'approve', 'export'
  resource: string; // 'orders', 'reports', 'settings', etc.
  accessLevelRequired: number; // Specific level needed for this action
  roleOverrides?: RoleOverride[]; // Special rules for specific roles
}

interface RoleOverride {
  role: Role;
  accessLevelRequired: number;
  additionalConditions?: (user: User, resource: any) => boolean;
}
```

### 2. Example Module Implementations

#### A. Inventory Management Module (New)

```typescript
// modules/inventory/config.ts
export const inventoryModule: ModuleDefinition = {
  id: 'inventory',
  name: 'Inventory Management',
  description: 'Manage product inventory and stock levels',
  targetRoles: ['operations_manager', 'admin', 'warehouse_staff'],
  minimumAccessLevel: 2,
  permissions: [
    {
      action: 'view',
      resource: 'inventory',
      accessLevelRequired: 1,
    },
    {
      action: 'create',
      resource: 'stock_entry',
      accessLevelRequired: 2,
    },
    {
      action: 'edit',
      resource: 'stock_levels',
      accessLevelRequired: 3,
    },
    {
      action: 'approve',
      resource: 'stock_adjustment',
      accessLevelRequired: 4,
      roleOverrides: [
        {
          role: 'warehouse_manager',
          accessLevelRequired: 3, // Warehouse managers can approve at level 3
        }
      ]
    },
    {
      action: 'delete',
      resource: 'inventory_record',
      accessLevelRequired: 5,
    }
  ]
};
```

#### B. Customer Relations Module

```typescript
// modules/crm/config.ts
export const crmModule: ModuleDefinition = {
  id: 'crm',
  name: 'Customer Relations',
  description: 'Manage customer relationships and communications',
  targetRoles: ['sales_manager', 'customer_service', 'admin'],
  minimumAccessLevel: 1,
  permissions: [
    {
      action: 'view',
      resource: 'customers',
      accessLevelRequired: 1,
    },
    {
      action: 'create',
      resource: 'customer_note',
      accessLevelRequired: 2,
    },
    {
      action: 'edit',
      resource: 'customer_data',
      accessLevelRequired: 3,
      roleOverrides: [
        {
          role: 'customer_service',
          accessLevelRequired: 2, // CS can edit at level 2
          additionalConditions: (user, customer) => {
            // CS can only edit customers assigned to them
            return customer.assignedTo === user.id;
          }
        }
      ]
    },
    {
      action: 'export',
      resource: 'customer_list',
      accessLevelRequired: 4,
    },
    {
      action: 'delete',
      resource: 'customer_account',
      accessLevelRequired: 5,
    }
  ]
};
```

### 3. Module Access Control Implementation

```typescript
// services/moduleAccess.service.ts
export class ModuleAccessService {
  
  // Check if user can access a module
  canAccessModule(user: User, moduleId: string): boolean {
    const module = this.getModule(moduleId);
    
    // Check if user's role is allowed
    if (!module.targetRoles.includes(user.role)) {
      return false;
    }
    
    // Check if user meets minimum access level
    return user.accessLevel >= module.minimumAccessLevel;
  }
  
  // Check specific permission within a module
  hasPermission(
    user: User, 
    moduleId: string, 
    action: string, 
    resource: string,
    resourceData?: any
  ): boolean {
    const module = this.getModule(moduleId);
    const permission = module.permissions.find(
      p => p.action === action && p.resource === resource
    );
    
    if (!permission) return false;
    
    // Check for role-specific overrides
    const override = permission.roleOverrides?.find(
      o => o.role === user.role
    );
    
    if (override) {
      // Check access level
      if (user.accessLevel < override.accessLevelRequired) {
        return false;
      }
      
      // Check additional conditions
      if (override.additionalConditions) {
        return override.additionalConditions(user, resourceData);
      }
      
      return true;
    }
    
    // Default permission check
    return user.accessLevel >= permission.accessLevelRequired;
  }
  
  // Get available actions for a user in a module
  getAvailableActions(user: User, moduleId: string): string[] {
    const module = this.getModule(moduleId);
    
    return module.permissions
      .filter(permission => 
        this.hasPermission(user, moduleId, permission.action, permission.resource)
      )
      .map(permission => `${permission.action}:${permission.resource}`);
  }
}
```

### 4. Frontend Module Integration

```typescript
// components/modules/ModuleWrapper.tsx
interface ModuleWrapperProps {
  moduleId: string;
  children: React.ReactNode;
}

export const ModuleWrapper: React.FC<ModuleWrapperProps> = ({ 
  moduleId, 
  children 
}) => {
  const { user } = useAuth();
  const { canAccessModule } = useModuleAccess();
  
  if (!canAccessModule(user, moduleId)) {
    return <AccessDenied />;
  }
  
  return (
    <ModuleAccessContext.Provider value={{ moduleId, user }}>
      {children}
    </ModuleAccessContext.Provider>
  );
};

// components/modules/PermissionGate.tsx
interface PermissionGateProps {
  action: string;
  resource: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  action,
  resource,
  fallback = null,
  children
}) => {
  const { moduleId, user } = useModuleAccessContext();
  const { hasPermission } = useModuleAccess();
  
  if (!hasPermission(user, moduleId, action, resource)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};
```

### 5. Backend Middleware Integration

```typescript
// middleware/moduleAccess.middleware.ts
export const requireModuleAccess = (moduleId: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!moduleAccessService.canAccessModule(user, moduleId)) {
      return res.status(403).json({
        error: 'Access denied to this module'
      });
    }
    
    // Attach module context to request
    req.moduleContext = {
      moduleId,
      availableActions: moduleAccessService.getAvailableActions(user, moduleId)
    };
    
    next();
  };
};

export const requirePermission = (action: string, resource: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const moduleId = req.moduleContext?.moduleId;
    
    if (!moduleId) {
      return res.status(500).json({
        error: 'Module context not found'
      });
    }
    
    const resourceData = req.body || req.params;
    
    if (!moduleAccessService.hasPermission(
      user, 
      moduleId, 
      action, 
      resource,
      resourceData
    )) {
      return res.status(403).json({
        error: `Insufficient permissions for ${action} on ${resource}`
      });
    }
    
    next();
  };
};
```

### 6. Dynamic Module Loading

```typescript
// services/moduleLoader.service.ts
export class ModuleLoaderService {
  private modules: Map<string, ModuleDefinition> = new Map();
  
  // Register a new module
  registerModule(module: ModuleDefinition) {
    this.modules.set(module.id, module);
    this.updateUserPermissions(module);
  }
  
  // Get modules available to a user
  getUserModules(user: User): ModuleDefinition[] {
    return Array.from(this.modules.values())
      .filter(module => 
        module.targetRoles.includes(user.role) &&
        user.accessLevel >= module.minimumAccessLevel
      );
  }
  
  // Update database when new module is added
  private updateUserPermissions(module: ModuleDefinition) {
    // Add module permissions to permission table
    module.permissions.forEach(permission => {
      this.addPermissionToDatabase({
        moduleId: module.id,
        action: permission.action,
        resource: permission.resource,
        minAccessLevel: permission.accessLevelRequired
      });
    });
  }
}
```

### 7. API Route Example for New Module

```typescript
// routes/inventory.routes.ts
const router = Router();

// Apply module-level access control
router.use(requireModuleAccess('inventory'));

// View inventory - Level 1+
router.get(
  '/',
  requirePermission('view', 'inventory'),
  inventoryController.list
);

// Create stock entry - Level 2+
router.post(
  '/stock-entry',
  requirePermission('create', 'stock_entry'),
  validateStockEntry,
  inventoryController.createStockEntry
);

// Edit stock levels - Level 3+
router.put(
  '/stock-levels/:id',
  requirePermission('edit', 'stock_levels'),
  inventoryController.updateStockLevel
);

// Approve stock adjustment - Level 4+ (or Level 3 for warehouse_manager)
router.post(
  '/stock-adjustment/:id/approve',
  requirePermission('approve', 'stock_adjustment'),
  inventoryController.approveAdjustment
);

export default router;
```

### 8. Database Schema for Module Permissions

```sql
-- Module registry table
CREATE TABLE modules (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  minimum_access_level INTEGER DEFAULT 1,
  target_roles TEXT[], -- Array of role names
  config JSONB, -- Additional module configuration
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Module permissions table
CREATE TABLE module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id VARCHAR(50) REFERENCES modules(id),
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  access_level_required INTEGER DEFAULT 1,
  role_overrides JSONB, -- Store role-specific rules
  conditions JSONB, -- Store additional conditions
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User module access table (for tracking)
CREATE TABLE user_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  module_id VARCHAR(50) REFERENCES modules(id),
  accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actions_performed JSONB -- Track what actions user performed
);
```

## Implementation Examples

### Example 1: Adding a Finance Analytics Module

```typescript
const financeAnalyticsModule: ModuleDefinition = {
  id: 'finance_analytics',
  name: 'Finance Analytics',
  description: 'Advanced financial analysis and reporting',
  targetRoles: ['finance_manager', 'admin', 'cfo'],
  minimumAccessLevel: 3, // Only senior staff
  permissions: [
    {
      action: 'view',
      resource: 'financial_dashboard',
      accessLevelRequired: 3,
    },
    {
      action: 'create',
      resource: 'financial_report',
      accessLevelRequired: 4,
    },
    {
      action: 'export',
      resource: 'sensitive_financial_data',
      accessLevelRequired: 5,
      roleOverrides: [
        {
          role: 'cfo',
          accessLevelRequired: 4, // CFO can export at level 4
        }
      ]
    }
  ]
};
```

### Example 2: Adding a Multi-Department Module

```typescript
const projectManagementModule: ModuleDefinition = {
  id: 'project_management',
  name: 'Project Management',
  description: 'Cross-department project coordination',
  targetRoles: ['all'], // Special case: available to all roles
  minimumAccessLevel: 2,
  permissions: [
    {
      action: 'view',
      resource: 'projects',
      accessLevelRequired: 2,
      roleOverrides: [
        {
          role: 'admin',
          accessLevelRequired: 1, // Admins can always view
        }
      ]
    },
    {
      action: 'create',
      resource: 'project',
      accessLevelRequired: 3,
    },
    {
      action: 'assign',
      resource: 'team_members',
      accessLevelRequired: 4,
      additionalConditions: (user, project) => {
        // Can only assign to projects in their department
        return project.department === user.department || user.accessLevel === 5;
      }
    }
  ]
};
```

## Best Practices

1. **Module Independence**: Each module should be self-contained with its own permission definitions
2. **Graceful Degradation**: UI should adapt based on permissions, hiding unavailable features
3. **Clear Documentation**: Document required access levels for each module feature
4. **Testing**: Test all permission combinations for each role and access level
5. **Audit Trail**: Log all module access and actions for security compliance

## Module Development Checklist

- [ ] Define module configuration with target roles and permissions
- [ ] Implement backend middleware for access control
- [ ] Create frontend permission gates
- [ ] Add module to registry
- [ ] Update database with module permissions
- [ ] Test with different role/level combinations
- [ ] Document module access requirements
- [ ] Add to user training materials