import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  Clock,
  RefreshCw,
  Trash2,
  User,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { usePermissions } from '../../hooks/usePermissions';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';

interface ExpiredPermission {
  id: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  permission: {
    id: string;
    code: string;
    name: string;
    riskLevel?: string;
  };
  grantedAt: string;
  expiresAt: string;
  grantedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export const ExpiredPermissions: React.FC = () => {
  const { getExpiredPermissions, cleanupExpiredPermissions } = usePermissions();
  const { hasPermission } = usePermissionCheck();
  const [expiredPermissions, setExpiredPermissions] = useState<ExpiredPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [cleanupDialog, setCleanupDialog] = useState(false);

  useEffect(() => {
    loadExpiredPermissions();
  }, []);

  const loadExpiredPermissions = async () => {
    try {
      setLoading(true);
      const expired = await getExpiredPermissions();
      setExpiredPermissions(expired);
    } catch (error) {
      console.error('Failed to load expired permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    try {
      await cleanupExpiredPermissions();
      await loadExpiredPermissions();
      setCleanupDialog(false);
    } catch (error) {
      console.error('Failed to cleanup expired permissions:', error);
    }
  };

  const getRiskIcon = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'CRITICAL':
        return <AlertTriangle size={14} color="red" />;
      case 'HIGH':
        return <AlertTriangle size={14} color="orange" />;
      case 'MEDIUM':
        return <AlertTriangle size={14} color="yellow" />;
      default:
        return <Shield size={14} color="gray" />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Expired Permissions</Typography>
        <Box display="flex" gap={1}>
          <Button
            size="small"
            startIcon={<RefreshCw />}
            onClick={loadExpiredPermissions}
          >
            Refresh
          </Button>
          {hasPermission('permission.manage') && expiredPermissions.length > 0 && (
            <Button
              size="small"
              variant="contained"
              startIcon={<Trash2 />}
              onClick={() => setCleanupDialog(true)}
              color="error"
            >
              Cleanup All
            </Button>
          )}
        </Box>
      </Box>

      {expiredPermissions.length === 0 ? (
        <Alert severity="success" icon={<Clock />}>
          No expired permissions found. All permissions are properly managed.
        </Alert>
      ) : (
        <>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {expiredPermissions.length} expired permission{expiredPermissions.length !== 1 ? 's' : ''} found.
            These permissions are no longer active but haven't been cleaned up yet.
          </Alert>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Permission</TableCell>
                  <TableCell>Granted By</TableCell>
                  <TableCell>Granted</TableCell>
                  <TableCell>Expired</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expiredPermissions.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          <User size={16} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{item.user.fullName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getRiskIcon(item.permission.riskLevel)}
                        <Box>
                          <Typography variant="body2">{item.permission.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.permission.code}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {item.grantedBy ? (
                        <Typography variant="body2">{item.grantedBy.name}</Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          System
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(item.grantedAt), 'PP')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="error">
                        {formatDistanceToNow(new Date(item.expiresAt), { addSuffix: true })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(item.expiresAt), 'PP')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        icon={<Clock size={14} />}
                        label="Expired"
                        color="error"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Cleanup Confirmation Dialog */}
      <Dialog open={cleanupDialog} onClose={() => setCleanupDialog(false)}>
        <DialogTitle>Cleanup Expired Permissions?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently remove all {expiredPermissions.length} expired permission
            {expiredPermissions.length !== 1 ? 's' : ''} from the system. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCleanupDialog(false)}>Cancel</Button>
          <Button onClick={handleCleanup} color="error" variant="contained">
            Cleanup All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};