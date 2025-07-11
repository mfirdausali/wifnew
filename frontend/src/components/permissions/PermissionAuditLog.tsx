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
  Chip,
  IconButton,
  TablePagination,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Search,
  RefreshCw,
  Plus,
  Minus,
  Clock,
  User,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { usePermissions } from '../../hooks/usePermissions';

interface PermissionAuditLogProps {
  userId?: string | null;
}

interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: 'grant' | 'revoke' | 'expire';
  permission: {
    id: string;
    code: string;
    name: string;
    riskLevel?: string;
  };
  reason?: string;
  grantedBy?: {
    id: string;
    name: string;
    email: string;
  };
  revokedBy?: {
    id: string;
    name: string;
    email: string;
  };
  grantedAt?: string;
  revokedAt?: string;
  expiresAt?: string;
}

export const PermissionAuditLog: React.FC<PermissionAuditLogProps> = ({ userId }) => {
  const { getPermissionAuditLog } = usePermissions();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, [userId]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const auditLogs = await getPermissionAuditLog(userId);
      setLogs(auditLogs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'grant':
        return <Plus size={16} color="green" />;
      case 'revoke':
        return <Minus size={16} color="red" />;
      case 'expire':
        return <Clock size={16} color="orange" />;
      default:
        return <Shield size={16} />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'grant':
        return 'success';
      case 'revoke':
        return 'error';
      case 'expire':
        return 'warning';
      default:
        return 'default';
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
        return null;
    }
  };

  const filteredLogs = logs.filter(log =>
    log.permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.permission.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedLogs = filteredLogs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
        <Typography variant="h6">
          Permission Audit Log
          {userId && <Typography variant="caption" color="text.secondary"> (User Filtered)</Typography>}
        </Typography>
        <Box display="flex" gap={1}>
          <TextField
            size="small"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
            }}
          />
          <IconButton onClick={loadAuditLogs} size="small">
            <RefreshCw />
          </IconButton>
        </Box>
      </Box>

      {filteredLogs.length === 0 ? (
        <Alert severity="info">No audit logs found</Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Action</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Permission</TableCell>
                  <TableCell>By</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Chip
                        size="small"
                        icon={getActionIcon(log.action)}
                        label={log.action}
                        color={getActionColor(log.action) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          <User size={16} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{log.userName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.userEmail}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getRiskIcon(log.permission.riskLevel)}
                        <Box>
                          <Typography variant="body2">{log.permission.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.permission.code}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {log.action === 'grant' && log.grantedBy ? (
                        <Tooltip title={log.grantedBy.email}>
                          <Typography variant="body2">{log.grantedBy.name}</Typography>
                        </Tooltip>
                      ) : log.action === 'revoke' && log.revokedBy ? (
                        <Tooltip title={log.revokedBy.email}>
                          <Typography variant="body2">{log.revokedBy.name}</Typography>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          System
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={
                          log.action === 'grant' && log.grantedAt
                            ? format(new Date(log.grantedAt), 'PPpp')
                            : log.action === 'revoke' && log.revokedAt
                            ? format(new Date(log.revokedAt), 'PPpp')
                            : ''
                        }
                      >
                        <Typography variant="body2">
                          {log.action === 'grant' && log.grantedAt
                            ? formatDistanceToNow(new Date(log.grantedAt), { addSuffix: true })
                            : log.action === 'revoke' && log.revokedAt
                            ? formatDistanceToNow(new Date(log.revokedAt), { addSuffix: true })
                            : 'N/A'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {log.reason || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {log.expiresAt && (
                        <Chip
                          size="small"
                          icon={<Clock size={14} />}
                          label={`Expires ${formatDistanceToNow(new Date(log.expiresAt))}`}
                          color="warning"
                        />
                      )}
                      {log.revokedAt && (
                        <Chip
                          size="small"
                          label="Revoked"
                          color="error"
                        />
                      )}
                      {!log.expiresAt && !log.revokedAt && log.action === 'grant' && (
                        <Chip
                          size="small"
                          label="Active"
                          color="success"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredLogs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
    </Box>
  );
};