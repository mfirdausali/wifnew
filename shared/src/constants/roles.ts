export const ROLES = {
  ADMIN: 'ADMIN',
  SALES: 'SALES',
  FINANCE: 'FINANCE',
  OPERATIONS: 'OPERATIONS'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION'
} as const;

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];

// Role permissions mapping
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'settings.read',
    'settings.update',
    'reports.read',
    'reports.create',
    'all.access'
  ],
  [ROLES.SALES]: [
    'customers.create',
    'customers.read',
    'customers.update',
    'orders.create',
    'orders.read',
    'orders.update',
    'reports.sales.read'
  ],
  [ROLES.FINANCE]: [
    'invoices.create',
    'invoices.read',
    'invoices.update',
    'transactions.read',
    'reports.finance.read',
    'reports.finance.create'
  ],
  [ROLES.OPERATIONS]: [
    'inventory.read',
    'inventory.update',
    'suppliers.read',
    'suppliers.update',
    'fulfillment.read',
    'fulfillment.update'
  ]
} as const;

// Helper function to check if a role has a specific permission
export function hasPermission(role: Role, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes('all.access') || permissions.includes(permission as any);
}