import React, { useMemo, memo } from 'react';
import { DataTable } from './DataTable';
import { Avatar } from '../atoms/Avatar';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  KeyIcon, 
  BanIcon,
  CheckCircleIcon,
  UserPlusIcon,
  DownloadIcon,
  UsersIcon
} from 'lucide-react';
import type { 
  DataTableProps, 
  TableColumn, 
  RowAction, 
  BulkAction,
  TableFilter 
} from './DataTable.types';
import { tokens } from '@/lib/design-tokens';
import styles from './UserTable.module.css';

// User type definition
export interface User {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  initials?: string;
  role: 'admin' | 'sales_manager' | 'finance_manager' | 'operations_manager' | 'employee';
  department?: string;
  accessLevel: 1 | 2 | 3 | 4 | 5;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  statusReason?: string;
  isOnline?: boolean;
  lastLoginAt?: Date | string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  permissions?: string[];
}

export interface UserTableProps extends Omit<DataTableProps<User>, 'columns' | 'data'> {
  users: User[];
  onViewUser?: (user: User) => void;
  onEditUser?: (user: User) => void;
  onDeleteUser?: (user: User) => void;
  onResetPassword?: (user: User) => void;
  onToggleStatus?: (user: User) => void;
  onBulkExport?: (userIds: string[], format: string) => void;
  onBulkUpdateRole?: (userIds: string[]) => void;
  onBulkToggleStatus?: (userIds: string[], status: 'active' | 'inactive') => void;
  hasPermission?: (permission: string) => boolean;
}

// Role badge component
const RoleBadge: React.FC<{ role: User['role']; size?: 'sm' | 'md' }> = ({ role, size = 'sm' }) => {
  const roleConfig = {
    admin: { label: 'Administrator', color: tokens.colors.role.admin },
    sales_manager: { label: 'Sales Manager', color: tokens.colors.role.sales },
    finance_manager: { label: 'Finance Manager', color: tokens.colors.role.finance },
    operations_manager: { label: 'Operations Manager', color: tokens.colors.role.operations },
    employee: { label: 'Employee', color: tokens.colors.gray[600] },
  };

  const config = roleConfig[role] || roleConfig.employee;

  return (
    <Badge 
      variant="custom" 
      size={size}
      style={{ 
        backgroundColor: `${config.color}20`,
        color: config.color,
        border: `1px solid ${config.color}40`
      }}
    >
      {config.label}
    </Badge>
  );
};

// Status badge component
const StatusBadge: React.FC<{ 
  status: User['status']; 
  reason?: string;
  showTooltip?: boolean;
}> = ({ status, reason, showTooltip }) => {
  const statusConfig = {
    active: { label: 'Active', variant: 'success' as const },
    inactive: { label: 'Inactive', variant: 'secondary' as const },
    suspended: { label: 'Suspended', variant: 'warning' as const },
    pending: { label: 'Pending', variant: 'info' as const },
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge 
      variant={config.variant}
      size="sm"
      title={showTooltip && reason ? reason : undefined}
    >
      {config.label}
    </Badge>
  );
};

// Access level badge component
const AccessLevelBadge: React.FC<{ 
  level: User['accessLevel']; 
  showDescription?: boolean;
}> = ({ level, showDescription }) => {
  const levelConfig = {
    1: { label: 'Basic', description: 'View only' },
    2: { label: 'Standard', description: 'View & Edit' },
    3: { label: 'Enhanced', description: 'Full module access' },
    4: { label: 'Manager', description: 'Department control' },
    5: { label: 'Executive', description: 'Full system access' },
  };

  const config = levelConfig[level] || levelConfig[1];
  const color = tokens.colors.access[level];

  return (
    <div className={styles.accessLevel}>
      <Badge 
        variant="custom"
        size="sm"
        style={{ 
          backgroundColor: `${color}20`,
          color: color,
          border: `1px solid ${color}40`
        }}
      >
        Level {level}
      </Badge>
      {showDescription && (
        <span className={styles.accessDescription}>{config.description}</span>
      )}
    </div>
  );
};

// Time ago component
const TimeAgo: React.FC<{ date?: Date | string }> = ({ date }) => {
  if (!date) return <span className={styles.timeAgo}>Never</span>;

  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let text = '';
  if (days > 0) {
    text = `${days}d ago`;
  } else if (hours > 0) {
    text = `${hours}h ago`;
  } else if (minutes > 0) {
    text = `${minutes}m ago`;
  } else {
    text = 'Just now';
  }

  return <span className={styles.timeAgo}>{text}</span>;
};

export const UserTable = memo(({
  users,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onResetPassword,
  onToggleStatus,
  onBulkExport,
  onBulkUpdateRole,
  onBulkToggleStatus,
  hasPermission = () => true,
  ...dataTableProps
}: UserTableProps) => {
  // Define columns
  const columns = useMemo<TableColumn<User>[]>(() => [
    {
      id: 'user',
      header: 'User',
      accessor: 'fullName',
      cell: ({ row }) => (
        <div className={styles.userCell}>
          <Avatar
            src={row.avatar}
            alt={row.fullName}
            fallback={row.initials || row.fullName?.substring(0, 2).toUpperCase()}
            size="sm"
            status={row.isOnline ? 'online' : 'offline'}
          />
          <div className={styles.userInfo}>
            <span className={styles.userName}>{row.fullName}</span>
            <span className={styles.userEmail}>{row.email}</span>
          </div>
        </div>
      ),
      sortable: true,
      filterable: true,
      minWidth: '200px',
    },
    {
      id: 'role',
      header: 'Role',
      accessor: 'role',
      cell: ({ value }) => <RoleBadge role={value} />,
      sortable: true,
      filterable: true,
      width: '180px',
    },
    {
      id: 'department',
      header: 'Department',
      accessor: 'department',
      cell: ({ value }) => value || '-',
      sortable: true,
      filterable: true,
      width: '150px',
    },
    {
      id: 'accessLevel',
      header: 'Access Level',
      accessor: 'accessLevel',
      cell: ({ value }) => <AccessLevelBadge level={value} showDescription />,
      sortable: true,
      filterable: true,
      width: '160px',
      align: 'center',
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      cell: ({ value, row }) => (
        <StatusBadge
          status={value}
          reason={row.statusReason}
          showTooltip
        />
      ),
      sortable: true,
      filterable: true,
      width: '120px',
    },
    {
      id: 'lastActive',
      header: 'Last Active',
      accessor: 'lastLoginAt',
      cell: ({ value }) => <TimeAgo date={value} />,
      sortable: true,
      width: '120px',
      dataType: 'date',
    },
    {
      id: 'createdAt',
      header: 'Created',
      accessor: 'createdAt',
      cell: ({ value }) => (
        <span className={styles.date}>
          {new Date(value).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </span>
      ),
      sortable: true,
      width: '120px',
      dataType: 'date',
    },
  ], []);

  // Define row actions
  const rowActions = useMemo<RowAction<User>[]>(() => {
    const actions: RowAction<User>[] = [];

    if (onViewUser) {
      actions.push({
        id: 'view',
        label: 'View Details',
        icon: EyeIcon,
        onClick: onViewUser,
      });
    }

    if (onEditUser && hasPermission('users.edit')) {
      actions.push({
        id: 'edit',
        label: 'Edit',
        icon: PencilIcon,
        onClick: onEditUser,
      });
    }

    if (onResetPassword && hasPermission('users.reset-password')) {
      actions.push({
        id: 'reset-password',
        label: 'Reset Password',
        icon: KeyIcon,
        onClick: onResetPassword,
        show: (user) => user.status === 'active',
      });
    }

    if (onToggleStatus && hasPermission('users.toggle-status')) {
      actions.push({
        id: 'toggle-status',
        label: (user: User) => user.status === 'active' ? 'Deactivate' : 'Activate',
        icon: (user: User) => user.status === 'active' ? BanIcon : CheckCircleIcon,
        onClick: onToggleStatus,
        variant: (user: User) => user.status === 'active' ? 'warning' : 'success',
        confirmable: true,
        confirmMessage: (user: User) => 
          `Are you sure you want to ${user.status === 'active' ? 'deactivate' : 'activate'} ${user.fullName}?`,
      });
    }

    if (onDeleteUser && hasPermission('users.delete')) {
      actions.push({
        id: 'delete',
        label: 'Delete',
        icon: TrashIcon,
        onClick: onDeleteUser,
        variant: 'danger',
        confirmable: true,
        confirmMessage: (user) => `Are you sure you want to delete ${user.fullName}? This action cannot be undone.`,
      });
    }

    return actions;
  }, [onViewUser, onEditUser, onResetPassword, onToggleStatus, onDeleteUser, hasPermission]);

  // Define bulk actions
  const bulkActions = useMemo<BulkAction<User>[]>(() => {
    const actions: BulkAction<User>[] = [];

    if (onBulkExport) {
      actions.push({
        id: 'export',
        label: 'Export Selected',
        icon: DownloadIcon,
        onClick: (ids) => onBulkExport(ids, 'csv'),
      });
    }

    if (onBulkUpdateRole && hasPermission('users.update-role')) {
      actions.push({
        id: 'update-role',
        label: 'Update Role',
        icon: UsersIcon,
        onClick: (ids) => onBulkUpdateRole(ids),
      });
    }

    if (onBulkToggleStatus && hasPermission('users.toggle-status')) {
      actions.push({
        id: 'activate',
        label: 'Activate',
        icon: CheckCircleIcon,
        onClick: (ids) => onBulkToggleStatus(ids, 'active'),
        variant: 'success',
        show: (_, users) => users.some(u => u.status !== 'active'),
      });

      actions.push({
        id: 'deactivate',
        label: 'Deactivate',
        icon: BanIcon,
        onClick: (ids) => onBulkToggleStatus(ids, 'inactive'),
        variant: 'warning',
        confirmable: true,
        confirmMessage: (count) => `Are you sure you want to deactivate ${count} users?`,
        show: (_, users) => users.some(u => u.status === 'active'),
      });
    }

    return actions;
  }, [onBulkExport, onBulkUpdateRole, onBulkToggleStatus, hasPermission]);

  // Define filters
  const filters = useMemo<TableFilter[]>(() => [
    {
      id: 'role',
      label: 'Role',
      type: 'select',
      options: [
        { value: 'admin', label: 'Administrator' },
        { value: 'sales_manager', label: 'Sales Manager' },
        { value: 'finance_manager', label: 'Finance Manager' },
        { value: 'operations_manager', label: 'Operations Manager' },
        { value: 'employee', label: 'Employee' },
      ],
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'suspended', label: 'Suspended' },
        { value: 'pending', label: 'Pending' },
      ],
    },
    {
      id: 'accessLevel',
      label: 'Access Level',
      type: 'select',
      options: [
        { value: '1', label: 'Level 1 - Basic' },
        { value: '2', label: 'Level 2 - Standard' },
        { value: '3', label: 'Level 3 - Enhanced' },
        { value: '4', label: 'Level 4 - Manager' },
        { value: '5', label: 'Level 5 - Executive' },
      ],
    },
  ], []);

  return (
    <DataTable
      data={users}
      columns={columns}
      rowActions={rowActions}
      bulkActions={bulkActions}
      filters={filters}
      selectionMode="multiple"
      sortable
      paginated
      showFilters
      quickFilter
      striped
      hoverable
      stickyHeader
      showActionsColumn={rowActions.length > 0}
      emptyMessage="No users found. Add your first user to get started."
      getRowId={(user) => user.id}
      {...dataTableProps}
    />
  );
});

UserTable.displayName = 'UserTable';