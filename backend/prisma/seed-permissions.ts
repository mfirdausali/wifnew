import { PrismaClient, PermissionRiskLevel, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
  // User Management
  {
    code: 'users.view',
    name: 'View Users',
    description: 'View user list and details',
    category: 'User Management',
    module: 'users',
    riskLevel: PermissionRiskLevel.LOW,
    defaultForRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.FINANCE_MANAGER, UserRole.OPERATIONS_MANAGER],
    minAccessLevel: 1,
  },
  {
    code: 'users.create',
    name: 'Create Users',
    description: 'Create new user accounts',
    category: 'User Management',
    module: 'users',
    riskLevel: PermissionRiskLevel.HIGH,
    defaultForRoles: [UserRole.ADMIN],
    minAccessLevel: 3,
  },
  {
    code: 'users.update',
    name: 'Update Users',
    description: 'Update user information',
    category: 'User Management',
    module: 'users',
    riskLevel: PermissionRiskLevel.MEDIUM,
    defaultForRoles: [UserRole.ADMIN],
    minAccessLevel: 3,
  },
  {
    code: 'users.delete',
    name: 'Delete Users',
    description: 'Delete user accounts',
    category: 'User Management',
    module: 'users',
    riskLevel: PermissionRiskLevel.CRITICAL,
    requires2fa: true,
    defaultForRoles: [UserRole.ADMIN],
    minAccessLevel: 4,
  },
  {
    code: 'users.bulk_update',
    name: 'Bulk Update Users',
    description: 'Update multiple users at once',
    category: 'User Management',
    module: 'users',
    riskLevel: PermissionRiskLevel.HIGH,
    requires2fa: true,
    defaultForRoles: [UserRole.ADMIN],
    minAccessLevel: 4,
  },
  {
    code: 'users.export',
    name: 'Export Users',
    description: 'Export user data',
    category: 'User Management',
    module: 'users',
    riskLevel: PermissionRiskLevel.MEDIUM,
    defaultForRoles: [UserRole.ADMIN],
    minAccessLevel: 3,
  },
  {
    code: 'users.import',
    name: 'Import Users',
    description: 'Import user data',
    category: 'User Management',
    module: 'users',
    riskLevel: PermissionRiskLevel.HIGH,
    requires2fa: true,
    defaultForRoles: [UserRole.ADMIN],
    minAccessLevel: 4,
  },

  // Permission Management
  {
    code: 'permission.view',
    name: 'View Permissions',
    description: 'View permissions and assignments',
    category: 'Permission Management',
    module: 'permissions',
    riskLevel: PermissionRiskLevel.LOW,
    defaultForRoles: [UserRole.ADMIN],
    minAccessLevel: 2,
  },
  {
    code: 'permission.grant',
    name: 'Grant Permissions',
    description: 'Grant permissions to users',
    category: 'Permission Management',
    module: 'permissions',
    riskLevel: PermissionRiskLevel.CRITICAL,
    requires2fa: true,
    requiresApproval: true,
    defaultForRoles: [UserRole.ADMIN],
    minAccessLevel: 4,
  },
  {
    code: 'permission.revoke',
    name: 'Revoke Permissions',
    description: 'Revoke permissions from users',
    category: 'Permission Management',
    module: 'permissions',
    riskLevel: PermissionRiskLevel.HIGH,
    requires2fa: true,
    defaultForRoles: [UserRole.ADMIN],
    minAccessLevel: 4,
  },
  {
    code: 'permission.grant_temporary',
    name: 'Grant Temporary Permissions',
    description: 'Grant time-limited permissions',
    category: 'Permission Management',
    module: 'permissions',
    riskLevel: PermissionRiskLevel.HIGH,
    requires2fa: true,
    defaultForRoles: [UserRole.ADMIN],
    minAccessLevel: 3,
  },
  {
    code: 'permission.audit',
    name: 'View Permission Audit',
    description: 'View permission audit logs',
    category: 'Permission Management',
    module: 'permissions',
    riskLevel: PermissionRiskLevel.LOW,
    defaultForRoles: [UserRole.ADMIN],
    minAccessLevel: 3,
  },
  {
    code: 'permission.manage',
    name: 'Manage Permissions',
    description: 'Create, update, and delete permissions',
    category: 'Permission Management',
    module: 'permissions',
    riskLevel: PermissionRiskLevel.CRITICAL,
    requires2fa: true,
    defaultForRoles: [UserRole.ADMIN],
    minAccessLevel: 5,
  },

  // Department Management
  {
    code: 'department.view',
    name: 'View Departments',
    description: 'View department information',
    category: 'Department Management',
    module: 'departments',
    riskLevel: PermissionRiskLevel.LOW,
    defaultForRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.FINANCE_MANAGER, UserRole.OPERATIONS_MANAGER],
    minAccessLevel: 1,
  },
  {
    code: 'department.edit',
    name: 'Edit Departments',
    description: 'Edit department information',
    category: 'Department Management',
    module: 'departments',
    riskLevel: PermissionRiskLevel.MEDIUM,
    defaultForRoles: [UserRole.ADMIN],
    minAccessLevel: 3,
  },
  {
    code: 'department.manage',
    name: 'Manage Departments',
    description: 'Create and delete departments',
    category: 'Department Management',
    module: 'departments',
    riskLevel: PermissionRiskLevel.HIGH,
    defaultForRoles: [UserRole.ADMIN],
    minAccessLevel: 4,
  },

  // Sales Permissions
  {
    code: 'sales.view',
    name: 'View Sales Data',
    description: 'View sales reports and metrics',
    category: 'Sales',
    module: 'sales',
    riskLevel: PermissionRiskLevel.LOW,
    defaultForRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER],
    minAccessLevel: 1,
  },
  {
    code: 'sales.manage_customers',
    name: 'Manage Customers',
    description: 'Create and manage customer records',
    category: 'Sales',
    module: 'sales',
    riskLevel: PermissionRiskLevel.MEDIUM,
    defaultForRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER],
    minAccessLevel: 2,
  },
  {
    code: 'sales.manage_orders',
    name: 'Manage Orders',
    description: 'Create and manage sales orders',
    category: 'Sales',
    module: 'sales',
    riskLevel: PermissionRiskLevel.MEDIUM,
    defaultForRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER],
    minAccessLevel: 2,
  },

  // Finance Permissions
  {
    code: 'finance.view',
    name: 'View Finance Data',
    description: 'View financial reports and metrics',
    category: 'Finance',
    module: 'finance',
    riskLevel: PermissionRiskLevel.MEDIUM,
    defaultForRoles: [UserRole.ADMIN, UserRole.FINANCE_MANAGER],
    minAccessLevel: 2,
  },
  {
    code: 'finance.manage_transactions',
    name: 'Manage Transactions',
    description: 'Create and manage financial transactions',
    category: 'Finance',
    module: 'finance',
    riskLevel: PermissionRiskLevel.HIGH,
    requires2fa: true,
    defaultForRoles: [UserRole.ADMIN, UserRole.FINANCE_MANAGER],
    minAccessLevel: 3,
  },
  {
    code: 'finance.approve_expenses',
    name: 'Approve Expenses',
    description: 'Approve expense reports',
    category: 'Finance',
    module: 'finance',
    riskLevel: PermissionRiskLevel.HIGH,
    requiresApproval: true,
    defaultForRoles: [UserRole.ADMIN, UserRole.FINANCE_MANAGER],
    minAccessLevel: 3,
  },

  // Operations Permissions
  {
    code: 'operations.view',
    name: 'View Operations Data',
    description: 'View operations reports and metrics',
    category: 'Operations',
    module: 'operations',
    riskLevel: PermissionRiskLevel.LOW,
    defaultForRoles: [UserRole.ADMIN, UserRole.OPERATIONS_MANAGER],
    minAccessLevel: 1,
  },
  {
    code: 'operations.manage_orders',
    name: 'Manage Order Fulfillment',
    description: 'Manage order processing and fulfillment',
    category: 'Operations',
    module: 'operations',
    riskLevel: PermissionRiskLevel.MEDIUM,
    defaultForRoles: [UserRole.ADMIN, UserRole.OPERATIONS_MANAGER],
    minAccessLevel: 2,
  },
  {
    code: 'operations.manage_inventory',
    name: 'Manage Inventory',
    description: 'Manage inventory levels and stock',
    category: 'Operations',
    module: 'operations',
    riskLevel: PermissionRiskLevel.MEDIUM,
    defaultForRoles: [UserRole.ADMIN, UserRole.OPERATIONS_MANAGER],
    minAccessLevel: 2,
  },

  // System Permissions
  {
    code: 'system.view_audit',
    name: 'View System Audit',
    description: 'View system audit logs',
    category: 'System',
    module: 'system',
    riskLevel: PermissionRiskLevel.LOW,
    defaultForRoles: [UserRole.ADMIN],
    minAccessLevel: 3,
  },
  {
    code: 'system.config',
    name: 'System Configuration',
    description: 'Modify system configuration',
    category: 'System',
    module: 'system',
    riskLevel: PermissionRiskLevel.CRITICAL,
    requires2fa: true,
    requiresApproval: true,
    defaultForRoles: [UserRole.ADMIN],
    minAccessLevel: 5,
  },
  {
    code: 'system.backup',
    name: 'System Backup',
    description: 'Create and restore system backups',
    category: 'System',
    module: 'system',
    riskLevel: PermissionRiskLevel.HIGH,
    requires2fa: true,
    defaultForRoles: [UserRole.ADMIN],
    minAccessLevel: 4,
  },
];

async function seedPermissions() {
  console.log('Seeding permissions...');

  try {
    // Create permissions with hierarchy
    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { code: permission.code },
        update: {
          name: permission.name,
          description: permission.description,
          category: permission.category,
          module: permission.module,
          riskLevel: permission.riskLevel,
          requires2fa: permission.requires2fa || false,
          requiresApproval: permission.requiresApproval || false,
          defaultForRoles: permission.defaultForRoles,
          minAccessLevel: permission.minAccessLevel,
          isActive: true,
          isSystem: true,
        },
        create: permission,
      });
      console.log(`✓ Permission created/updated: ${permission.code}`);
    }

    // Create some hierarchical permissions
    const userManagementParent = await prisma.permission.findUnique({
      where: { code: 'users.view' },
    });

    if (userManagementParent) {
      await prisma.permission.upsert({
        where: { code: 'users.view.own' },
        update: {
          name: 'View Own Profile',
          description: 'View own user profile',
          category: 'User Management',
          module: 'users',
          parentId: userManagementParent.id,
          level: 1,
          path: userManagementParent.id,
          riskLevel: PermissionRiskLevel.LOW,
          defaultForRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.FINANCE_MANAGER, UserRole.OPERATIONS_MANAGER],
          minAccessLevel: 1,
        },
        create: {
          code: 'users.view.own',
          name: 'View Own Profile',
          description: 'View own user profile',
          category: 'User Management',
          module: 'users',
          parentId: userManagementParent.id,
          level: 1,
          path: userManagementParent.id,
          riskLevel: PermissionRiskLevel.LOW,
          defaultForRoles: [UserRole.ADMIN, UserRole.SALES_MANAGER, UserRole.FINANCE_MANAGER, UserRole.OPERATIONS_MANAGER],
          minAccessLevel: 1,
          isActive: true,
          isSystem: true,
        },
      });
      console.log('✓ Hierarchical permission created: users.view.own');
    }

    console.log('\n✅ All permissions seeded successfully!');
  } catch (error) {
    console.error('Error seeding permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedPermissions()
  .catch((error) => {
    console.error('Failed to seed permissions:', error);
    process.exit(1);
  });