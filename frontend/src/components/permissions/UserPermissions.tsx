import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Autocomplete,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Grid,
  Paper,
  Alert,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Plus,
  Trash2,
  Clock,
  Copy,
  Shield,
  AlertTriangle,
  Key,
  User,
} from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import { usePermissions } from '../../hooks/usePermissions';
import { User, Permission } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface UserPermissionsProps {
  selectedUserId: string | null;
  onUserSelect: (userId: string | null) => void;
}

export const UserPermissions: React.FC<UserPermissionsProps> = ({
  selectedUserId,
  onUserSelect,
}) => {
  const { users, getUser } = useUsers();
  const {
    getUserPermissions,
    grantPermissions,
    revokePermissions,
    grantTemporaryPermission,
    permissions,
  } = usePermissions();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [temporaryGrantDialog, setTemporaryGrantDialog] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [grantReason, setGrantReason] = useState('');
  const [temporaryHours, setTemporaryHours] = useState(24);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedUserId) {
      loadUserPermissions(selectedUserId);
    }
  }, [selectedUserId]);

  const loadUserPermissions = async (userId: string) => {
    try {
      setLoading(true);
      const user = await getUser(userId);
      const permissions = await getUserPermissions(userId);
      setSelectedUser(user);
      setUserPermissions(permissions);
    } catch (error) {
      console.error('Failed to load user permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantPermissions = async () => {
    if (!selectedUser || selectedPermissions.length === 0) return;

    try {
      await grantPermissions(selectedUser.id, selectedPermissions, grantReason);
      await loadUserPermissions(selectedUser.id);
      setGrantDialogOpen(false);
      setSelectedPermissions([]);
      setGrantReason('');
    } catch (error) {
      console.error('Failed to grant permissions:', error);
    }
  };

  const handleRevokePermission = async (permissionCode: string) => {
    if (!selectedUser) return;

    try {
      await revokePermissions(selectedUser.id, [permissionCode]);
      await loadUserPermissions(selectedUser.id);
    } catch (error) {
      console.error('Failed to revoke permission:', error);
    }
  };

  const handleGrantTemporary = async () => {
    if (!selectedUser || selectedPermissions.length !== 1) return;

    try {
      await grantTemporaryPermission(
        selectedUser.id,
        selectedPermissions[0],
        temporaryHours
      );
      await loadUserPermissions(selectedUser.id);
      setTemporaryGrantDialog(false);
      setSelectedPermissions([]);
      setTemporaryHours(24);
    } catch (error) {
      console.error('Failed to grant temporary permission:', error);
    }
  };

  const getRiskIcon = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'CRITICAL':
        return <AlertTriangle size={16} color="red" />;
      case 'HIGH':
        return <AlertTriangle size={16} color="orange" />;
      case 'MEDIUM':
        return <AlertTriangle size={16} color="yellow" />;
      default:
        return <Shield size={16} color="green" />;
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Select User
          </Typography>
          <Autocomplete
            options={users}
            getOptionLabel={(option) => `${option.fullName} (${option.email})`}
            value={selectedUser}
            onChange={(_, newValue) => {
              setSelectedUser(newValue);
              onUserSelect(newValue?.id || null);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search users..."
                variant="outlined"
                fullWidth
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box>
                  <Typography variant="body2">{option.fullName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.email} • {option.role}
                  </Typography>
                </Box>
              </Box>
            )}
          />

          {selectedUser && (
            <Box mt={3}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <User />
                <Typography variant="subtitle1">{selectedUser.fullName}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {selectedUser.email}
              </Typography>
              <Box display="flex" gap={1} mt={1}>
                <Chip size="small" label={selectedUser.role} />
                <Chip size="small" label={`Level ${selectedUser.accessLevel}`} />
              </Box>
            </Box>
          )}
        </Paper>
      </Grid>

      <Grid item xs={12} md={8}>
        {selectedUser ? (
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">User Permissions</Typography>
              <Box display="flex" gap={1}>
                <Button
                  size="small"
                  startIcon={<Clock />}
                  onClick={() => {
                    setTemporaryGrantDialog(true);
                    setSelectedPermissions([]);
                  }}
                >
                  Grant Temporary
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Plus />}
                  onClick={() => {
                    setGrantDialogOpen(true);
                    setSelectedPermissions([]);
                  }}
                >
                  Grant Permissions
                </Button>
              </Box>
            </Box>

            {userPermissions.length === 0 ? (
              <Alert severity="info">
                This user has no direct permissions. They may have permissions through their role.
              </Alert>
            ) : (
              <List>
                {userPermissions.map((permission) => (
                  <ListItem key={permission.id} divider>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          {getRiskIcon(permission.riskLevel)}
                          <Typography variant="body1">{permission.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({permission.code})
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          {permission.description && (
                            <Typography variant="body2" color="text.secondary">
                              {permission.description}
                            </Typography>
                          )}
                          <Box display="flex" gap={1} mt={0.5}>
                            {permission.source && (
                              <Chip
                                size="small"
                                label={`From: ${permission.source}`}
                                variant="outlined"
                              />
                            )}
                            {permission.expiresAt && (
                              <Chip
                                size="small"
                                icon={<Clock size={14} />}
                                label={`Expires ${formatDistanceToNow(new Date(permission.expiresAt))}`}
                                color="warning"
                              />
                            )}
                            {permission.requires2fa && (
                              <Chip
                                size="small"
                                icon={<Key size={14} />}
                                label="2FA Required"
                                color="primary"
                              />
                            )}
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      {permission.source === 'direct' && (
                        <IconButton
                          edge="end"
                          aria-label="revoke"
                          onClick={() => handleRevokePermission(permission.code)}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Select a user to manage their permissions
            </Typography>
          </Paper>
        )}
      </Grid>

      {/* Grant Permissions Dialog */}
      <Dialog
        open={grantDialogOpen}
        onClose={() => setGrantDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Grant Permissions</DialogTitle>
        <DialogContent>
          <Box mb={2}>
            <Autocomplete
              multiple
              options={permissions}
              getOptionLabel={(option) => `${option.name} (${option.code})`}
              value={permissions.filter(p => selectedPermissions.includes(p.code))}
              onChange={(_, newValue) => {
                setSelectedPermissions(newValue.map(p => p.code));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Permissions"
                  placeholder="Search permissions..."
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box display="flex" alignItems="center" gap={1} width="100%">
                    {getRiskIcon(option.riskLevel)}
                    <Box flexGrow={1}>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.code} • {option.category}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason"
            value={grantReason}
            onChange={(e) => setGrantReason(e.target.value)}
            helperText="Provide a reason for granting these permissions"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGrantDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleGrantPermissions}
            variant="contained"
            disabled={selectedPermissions.length === 0}
          >
            Grant Permissions
          </Button>
        </DialogActions>
      </Dialog>

      {/* Temporary Permission Dialog */}
      <Dialog
        open={temporaryGrantDialog}
        onClose={() => setTemporaryGrantDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Grant Temporary Permission</DialogTitle>
        <DialogContent>
          <Box mb={2}>
            <Autocomplete
              options={permissions}
              getOptionLabel={(option) => `${option.name} (${option.code})`}
              value={permissions.find(p => selectedPermissions.includes(p.code)) || null}
              onChange={(_, newValue) => {
                setSelectedPermissions(newValue ? [newValue.code] : []);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Permission"
                  placeholder="Search permissions..."
                />
              )}
            />
          </Box>
          <FormControl fullWidth>
            <InputLabel>Duration</InputLabel>
            <Select
              value={temporaryHours}
              onChange={(e) => setTemporaryHours(Number(e.target.value))}
              label="Duration"
            >
              <MenuItem value={1}>1 hour</MenuItem>
              <MenuItem value={4}>4 hours</MenuItem>
              <MenuItem value={8}>8 hours</MenuItem>
              <MenuItem value={24}>24 hours</MenuItem>
              <MenuItem value={48}>48 hours</MenuItem>
              <MenuItem value={168}>1 week</MenuItem>
              <MenuItem value={720}>30 days</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemporaryGrantDialog(false)}>Cancel</Button>
          <Button
            onClick={handleGrantTemporary}
            variant="contained"
            disabled={selectedPermissions.length !== 1}
          >
            Grant Temporary Permission
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};