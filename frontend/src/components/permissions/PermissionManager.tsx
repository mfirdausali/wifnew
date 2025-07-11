import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Shield,
  Users,
  Clock,
  History,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { PermissionTree } from './PermissionTree';
import { UserPermissions } from './UserPermissions';
import { PermissionAuditLog } from './PermissionAuditLog';
import { ExpiredPermissions } from './ExpiredPermissions';
import { CanAccess } from '../guards/PermissionGuard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`permission-tabpanel-${index}`}
      aria-labelledby={`permission-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export const PermissionManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const {
    permissions,
    permissionHierarchy,
    isLoading,
    error,
    refreshPermissions,
    cleanupExpiredPermissions,
  } = usePermissions();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCleanupExpired = async () => {
    try {
      await cleanupExpiredPermissions();
    } catch (error) {
      console.error('Failed to cleanup expired permissions:', error);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">
            Permission Management
          </Typography>
          <Box display="flex" gap={1}>
            <CanAccess permissions="permission.manage">
              <Tooltip title="Cleanup Expired Permissions">
                <IconButton onClick={handleCleanupExpired} color="primary">
                  <RefreshCw />
                </IconButton>
              </Tooltip>
            </CanAccess>
            <Tooltip title="Refresh">
              <IconButton onClick={refreshPermissions}>
                <RefreshCw />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="permission tabs">
            <Tab
              icon={<Shield />}
              label="Permissions"
              id="permission-tab-0"
              aria-controls="permission-tabpanel-0"
            />
            <Tab
              icon={<Users />}
              label="User Permissions"
              id="permission-tab-1"
              aria-controls="permission-tabpanel-1"
            />
            <Tab
              icon={<History />}
              label="Audit Log"
              id="permission-tab-2"
              aria-controls="permission-tabpanel-2"
            />
            <CanAccess permissions="permission.audit">
              <Tab
                icon={<Clock />}
                label="Expired"
                id="permission-tab-3"
                aria-controls="permission-tabpanel-3"
              />
            </CanAccess>
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <PermissionTree permissions={permissionHierarchy} />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <UserPermissions
            selectedUserId={selectedUserId}
            onUserSelect={setSelectedUserId}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <PermissionAuditLog userId={selectedUserId} />
        </TabPanel>

        <CanAccess permissions="permission.audit">
          <TabPanel value={activeTab} index={3}>
            <ExpiredPermissions />
          </TabPanel>
        </CanAccess>
      </CardContent>
    </Card>
  );
};

// Permission stats component
export const PermissionStats: React.FC = () => {
  const { permissions } = usePermissions();

  const stats = React.useMemo(() => {
    const total = permissions.length;
    const highRisk = permissions.filter(p => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL').length;
    const requires2FA = permissions.filter(p => p.requires2fa).length;
    const requiresApproval = permissions.filter(p => p.requiresApproval).length;

    return { total, highRisk, requires2FA, requiresApproval };
  }, [permissions]);

  return (
    <Box display="flex" gap={2} flexWrap="wrap">
      <Card sx={{ minWidth: 150 }}>
        <CardContent>
          <Typography color="text.secondary" gutterBottom>
            Total Permissions
          </Typography>
          <Typography variant="h4">{stats.total}</Typography>
        </CardContent>
      </Card>

      <Card sx={{ minWidth: 150 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1}>
            <AlertTriangle color="orange" size={20} />
            <Typography color="text.secondary" gutterBottom>
              High Risk
            </Typography>
          </Box>
          <Typography variant="h4" color="warning.main">
            {stats.highRisk}
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ minWidth: 150 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1}>
            <Shield size={20} />
            <Typography color="text.secondary" gutterBottom>
              Requires 2FA
            </Typography>
          </Box>
          <Typography variant="h4" color="primary">
            {stats.requires2FA}
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ minWidth: 150 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircle color="green" size={20} />
            <Typography color="text.secondary" gutterBottom>
              Requires Approval
            </Typography>
          </Box>
          <Typography variant="h4" color="success.main">
            {stats.requiresApproval}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};