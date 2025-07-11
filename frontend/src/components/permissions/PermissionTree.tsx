import React, { useState } from 'react';
import {
  Box,
  Typography,
  TreeView,
  TreeItem,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Collapse,
  Paper,
  Grid,
} from '@mui/material';
import {
  ChevronRight,
  ChevronDown,
  Search,
  Shield,
  AlertTriangle,
  Key,
  CheckCircle,
  Info,
} from 'lucide-react';
import { Permission } from '../../types';

interface PermissionNode extends Permission {
  children?: PermissionNode[];
}

interface PermissionTreeProps {
  permissions: PermissionNode[];
  onPermissionSelect?: (permission: Permission) => void;
  selectedPermissions?: string[];
  checkable?: boolean;
  onCheck?: (permissionIds: string[]) => void;
}

export const PermissionTree: React.FC<PermissionTreeProps> = ({
  permissions,
  onPermissionSelect,
  selectedPermissions = [],
  checkable = false,
  onCheck,
}) => {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);

  const handleToggle = (_event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  const handleSelect = (_event: React.SyntheticEvent, nodeId: string) => {
    const permission = findPermissionById(permissions, nodeId);
    if (permission) {
      setSelectedPermission(permission);
      onPermissionSelect?.(permission);
    }
  };

  const findPermissionById = (nodes: PermissionNode[], id: string): Permission | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findPermissionById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const filterPermissions = (nodes: PermissionNode[], term: string): PermissionNode[] => {
    return nodes.reduce<PermissionNode[]>((filtered, node) => {
      const matches = node.name.toLowerCase().includes(term.toLowerCase()) ||
                     node.code.toLowerCase().includes(term.toLowerCase()) ||
                     node.description?.toLowerCase().includes(term.toLowerCase());
      
      if (node.children) {
        const filteredChildren = filterPermissions(node.children, term);
        if (filteredChildren.length > 0) {
          filtered.push({ ...node, children: filteredChildren });
        } else if (matches) {
          filtered.push({ ...node, children: [] });
        }
      } else if (matches) {
        filtered.push(node);
      }
      
      return filtered;
    }, []);
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

  const renderTree = (nodes: PermissionNode[]) => {
    const filteredNodes = searchTerm ? filterPermissions(nodes, searchTerm) : nodes;

    return filteredNodes.map((node) => (
      <TreeItem
        key={node.id}
        nodeId={node.id}
        label={
          <Box display="flex" alignItems="center" gap={1} py={0.5}>
            {getRiskIcon(node.riskLevel)}
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              {node.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {node.code}
            </Typography>
            {node.requires2fa && (
              <Tooltip title="Requires 2FA">
                <Key size={14} />
              </Tooltip>
            )}
            {node.requiresApproval && (
              <Tooltip title="Requires Approval">
                <CheckCircle size={14} />
              </Tooltip>
            )}
          </Box>
        }
      >
        {node.children && renderTree(node.children)}
      </TreeItem>
    ));
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Box mb={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search permissions..."
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
        </Box>

        <Paper sx={{ p: 2, maxHeight: 600, overflow: 'auto' }}>
          <TreeView
            defaultCollapseIcon={<ChevronDown />}
            defaultExpandIcon={<ChevronRight />}
            expanded={expanded}
            selected={selectedPermission?.id || ''}
            onNodeToggle={handleToggle}
            onNodeSelect={handleSelect}
          >
            {renderTree(permissions)}
          </TreeView>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        {selectedPermission && (
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              {getRiskIcon(selectedPermission.riskLevel)}
              <Typography variant="h6">{selectedPermission.name}</Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="caption" color="text.secondary">
                Code
              </Typography>
              <Typography variant="body2" fontFamily="monospace">
                {selectedPermission.code}
              </Typography>
            </Box>

            {selectedPermission.description && (
              <Box mb={2}>
                <Typography variant="caption" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body2">
                  {selectedPermission.description}
                </Typography>
              </Box>
            )}

            <Box mb={2}>
              <Typography variant="caption" color="text.secondary">
                Category
              </Typography>
              <Typography variant="body2">
                {selectedPermission.category}
              </Typography>
            </Box>

            {selectedPermission.module && (
              <Box mb={2}>
                <Typography variant="caption" color="text.secondary">
                  Module
                </Typography>
                <Typography variant="body2">
                  {selectedPermission.module}
                </Typography>
              </Box>
            )}

            <Box display="flex" gap={1} flexWrap="wrap" mt={2}>
              {selectedPermission.riskLevel && (
                <Chip
                  size="small"
                  label={`Risk: ${selectedPermission.riskLevel}`}
                  color={
                    selectedPermission.riskLevel === 'CRITICAL' ? 'error' :
                    selectedPermission.riskLevel === 'HIGH' ? 'warning' :
                    'default'
                  }
                />
              )}
              {selectedPermission.requires2fa && (
                <Chip
                  size="small"
                  icon={<Key size={14} />}
                  label="Requires 2FA"
                  color="primary"
                />
              )}
              {selectedPermission.requiresApproval && (
                <Chip
                  size="small"
                  icon={<CheckCircle size={14} />}
                  label="Requires Approval"
                  color="success"
                />
              )}
              {selectedPermission.minAccessLevel && (
                <Chip
                  size="small"
                  label={`Min Access Level: ${selectedPermission.minAccessLevel}`}
                  variant="outlined"
                />
              )}
            </Box>

            {selectedPermission.defaultForRoles && selectedPermission.defaultForRoles.length > 0 && (
              <Box mt={2}>
                <Typography variant="caption" color="text.secondary">
                  Default for Roles
                </Typography>
                <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5}>
                  {selectedPermission.defaultForRoles.map((role) => (
                    <Chip key={role} size="small" label={role} />
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        )}
      </Grid>
    </Grid>
  );
};