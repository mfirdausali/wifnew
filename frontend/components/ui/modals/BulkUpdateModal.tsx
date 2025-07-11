import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
import { Button } from '../atoms/Button';
import { Select } from '../atoms/Select';
import { Checkbox } from '../atoms/Checkbox';
import { Badge } from '../atoms/Badge';
import { Avatar } from '../atoms/Avatar';
import { Spinner } from '../atoms/Spinner';
import { closeModal } from '@/store/slices/uiSlice';
import { bulkUpdateUsers } from '@/store/thunks/userThunks';
import { AppDispatch, RootState } from '@/store';
import { User, UserRole, UserStatus } from '@/types';
import styles from './BulkUpdateModal.module.css';
import {
  FiUsers,
  FiEdit3,
  FiShield,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';

type BulkActionType = 'update_status' | 'update_role' | 'update_department' | 'reset_passwords' | 'update_permissions';

interface BulkUpdateForm {
  status?: UserStatus;
  role?: UserRole;
  departmentId?: string;
  permissions?: string[];
  sendNotification: boolean;
}

interface ActionConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  fields: string[];
  variant: 'primary' | 'warning' | 'danger';
}

const actionConfigs: Record<BulkActionType, ActionConfig> = {
  update_status: {
    title: 'Update Status',
    description: 'Change the status for selected users',
    icon: <FiCheckCircle />,
    fields: ['status'],
    variant: 'primary'
  },
  update_role: {
    title: 'Update Role',
    description: 'Change the role for selected users',
    icon: <FiShield />,
    fields: ['role'],
    variant: 'warning'
  },
  update_department: {
    title: 'Update Department',
    description: 'Move users to a different department',
    icon: <FiUsers />,
    fields: ['departmentId'],
    variant: 'primary'
  },
  reset_passwords: {
    title: 'Reset Passwords',
    description: 'Force password reset for selected users',
    icon: <FiShield />,
    fields: [],
    variant: 'danger'
  },
  update_permissions: {
    title: 'Update Permissions',
    description: 'Add or remove permissions for selected users',
    icon: <FiEdit3 />,
    fields: ['permissions'],
    variant: 'warning'
  }
};

export const BulkUpdateModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const modalState = useSelector((state: RootState) => state.ui.modals.bulkAction);
  const selectedUserIds = useSelector((state: RootState) => state.users.selectedIds);
  const allUsers = useSelector((state: RootState) => state.users.list);
  const departments = useSelector((state: RootState) => state.departments.list);
  const permissions = useSelector((state: RootState) => state.permissions.available);
  
  const { isOpen, action } = modalState;
  const selectedUsers = allUsers.filter(user => selectedUserIds.includes(user.id));
  
  const [formData, setFormData] = useState<BulkUpdateForm>({
    sendNotification: true
  });
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<Array<{ userId: string; success: boolean; error?: string }>>([]);
  const [currentStep, setCurrentStep] = useState<'form' | 'preview' | 'processing' | 'results'>('form');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ sendNotification: true });
      setShowPreview(false);
      setCurrentStep('form');
      setResults([]);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!isProcessing) {
      dispatch(closeModal('bulkAction'));
    }
  };

  const handleFieldChange = (field: keyof BulkUpdateForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePreview = () => {
    setCurrentStep('preview');
  };

  const handleExecute = async () => {
    setCurrentStep('processing');
    setIsProcessing(true);
    
    try {
      const result = await dispatch(bulkUpdateUsers({
        userIds: selectedUserIds,
        updates: formData,
        action: action as BulkActionType
      })).unwrap();
      
      setResults(result);
      setCurrentStep('results');
    } catch (error) {
      console.error('Bulk update failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderFormStep = () => {
    const config = actionConfigs[action as BulkActionType];
    if (!config) return null;

    return (
      <div className={styles.formStep}>
        <div className={styles.actionHeader}>
          <div className={styles.actionIcon}>{config.icon}</div>
          <div>
            <h3>{config.title}</h3>
            <p>{config.description}</p>
          </div>
        </div>

        <div className={styles.selectedInfo}>
          <FiUsers />
          <span>{selectedUsers.length} users selected</span>
        </div>

        <div className={styles.formFields}>
          {config.fields.includes('status') && (
            <div className={styles.field}>
              <label>New Status</label>
              <Select
                value={formData.status || ''}
                onChange={(e) => handleFieldChange('status', e.target.value as UserStatus)}
                options={[
                  { value: '', label: 'Select status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'suspended', label: 'Suspended' }
                ]}
              />
            </div>
          )}

          {config.fields.includes('role') && (
            <div className={styles.field}>
              <label>New Role</label>
              <Select
                value={formData.role || ''}
                onChange={(e) => handleFieldChange('role', e.target.value as UserRole)}
                options={[
                  { value: '', label: 'Select role' },
                  { value: 'admin', label: 'Administrator' },
                  { value: 'sales_manager', label: 'Sales Manager' },
                  { value: 'finance_manager', label: 'Finance Manager' },
                  { value: 'operations_manager', label: 'Operations Manager' }
                ]}
              />
            </div>
          )}

          {config.fields.includes('departmentId') && (
            <div className={styles.field}>
              <label>New Department</label>
              <Select
                value={formData.departmentId || ''}
                onChange={(e) => handleFieldChange('departmentId', e.target.value)}
                options={[
                  { value: '', label: 'Select department' },
                  ...departments.map(dept => ({
                    value: dept.id,
                    label: dept.name
                  }))
                ]}
              />
            </div>
          )}

          {config.fields.includes('permissions') && (
            <div className={styles.field}>
              <label>Permissions</label>
              <div className={styles.permissionsList}>
                {permissions.map(permission => (
                  <Checkbox
                    key={permission.id}
                    label={permission.name}
                    checked={formData.permissions?.includes(permission.id) || false}
                    onChange={(checked) => {
                      const current = formData.permissions || [];
                      const updated = checked
                        ? [...current, permission.id]
                        : current.filter(p => p !== permission.id);
                      handleFieldChange('permissions', updated);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className={styles.field}>
            <Checkbox
              checked={formData.sendNotification}
              onChange={(checked) => handleFieldChange('sendNotification', checked)}
              label="Send notification email to affected users"
            />
          </div>
        </div>

        <div className={styles.warningBox}>
          <FiAlertCircle />
          <p>This action will affect {selectedUsers.length} users and cannot be undone.</p>
        </div>
      </div>
    );
  };

  const renderPreviewStep = () => {
    const config = actionConfigs[action as BulkActionType];
    const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

    const toggleUser = (userId: string) => {
      const newExpanded = new Set(expandedUsers);
      if (newExpanded.has(userId)) {
        newExpanded.delete(userId);
      } else {
        newExpanded.add(userId);
      }
      setExpandedUsers(newExpanded);
    };

    return (
      <div className={styles.previewStep}>
        <h3>Review Changes</h3>
        <p className={styles.previewDescription}>
          The following changes will be applied to {selectedUsers.length} users:
        </p>

        <div className={styles.changesSummary}>
          {formData.status && (
            <div className={styles.changeItem}>
              <span>Status:</span>
              <Badge variant={formData.status === 'active' ? 'success' : 'warning'}>
                {formData.status}
              </Badge>
            </div>
          )}
          {formData.role && (
            <div className={styles.changeItem}>
              <span>Role:</span>
              <Badge variant="purple">{formData.role.replace('_', ' ')}</Badge>
            </div>
          )}
          {formData.departmentId && (
            <div className={styles.changeItem}>
              <span>Department:</span>
              <span>{departments.find(d => d.id === formData.departmentId)?.name}</span>
            </div>
          )}
        </div>

        <div className={styles.usersList}>
          <h4>Affected Users</h4>
          {selectedUsers.slice(0, 5).map(user => (
            <div key={user.id} className={styles.userPreview}>
              <div 
                className={styles.userHeader}
                onClick={() => toggleUser(user.id)}
              >
                <Avatar name={user.fullName} size="sm" />
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.fullName}</span>
                  <span className={styles.userEmail}>{user.email}</span>
                </div>
                {expandedUsers.has(user.id) ? <FiChevronUp /> : <FiChevronDown />}
              </div>
              
              {expandedUsers.has(user.id) && (
                <div className={styles.userDetails}>
                  <div className={styles.detailRow}>
                    <span>Current Status:</span>
                    <Badge variant={user.status === 'active' ? 'success' : 'warning'} size="sm">
                      {user.status}
                    </Badge>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Current Role:</span>
                    <span>{user.role.replace('_', ' ')}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Department:</span>
                    <span>{departments.find(d => d.id === user.departmentId)?.name || 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {selectedUsers.length > 5 && (
            <p className={styles.moreUsers}>
              and {selectedUsers.length - 5} more users...
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderProcessingStep = () => {
    return (
      <div className={styles.processingStep}>
        <Spinner size="xl" />
        <h3>Processing Updates</h3>
        <p>Updating {selectedUsers.length} users...</p>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: '60%' }}
          />
        </div>
      </div>
    );
  };

  const renderResultsStep = () => {
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return (
      <div className={styles.resultsStep}>
        <div className={styles.resultsSummary}>
          <h3>Update Complete</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <FiCheckCircle className={styles.successIcon} />
              <div>
                <span className={styles.statValue}>{successCount}</span>
                <span className={styles.statLabel}>Successful</span>
              </div>
            </div>
            {failureCount > 0 && (
              <div className={styles.statCard}>
                <FiXCircle className={styles.errorIcon} />
                <div>
                  <span className={styles.statValue}>{failureCount}</span>
                  <span className={styles.statLabel}>Failed</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {failureCount > 0 && (
          <div className={styles.errorsList}>
            <h4>Failed Updates</h4>
            {results
              .filter(r => !r.success)
              .map(result => {
                const user = selectedUsers.find(u => u.id === result.userId);
                return (
                  <div key={result.userId} className={styles.errorItem}>
                    <span>{user?.fullName || result.userId}</span>
                    <span className={styles.errorMessage}>{result.error}</span>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'form':
        return renderFormStep();
      case 'preview':
        return renderPreviewStep();
      case 'processing':
        return renderProcessingStep();
      case 'results':
        return renderResultsStep();
      default:
        return null;
    }
  };

  const config = actionConfigs[action as BulkActionType];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      closeOnOverlayClick={false}
    >
      <ModalHeader>
        <h2 className={styles.modalTitle}>Bulk Action: {config?.title}</h2>
      </ModalHeader>
      
      <ModalBody>
        {renderContent()}
      </ModalBody>
      
      <ModalFooter>
        {currentStep === 'form' && (
          <>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handlePreview}
              disabled={!formData.status && !formData.role && !formData.departmentId}
            >
              Preview Changes
            </Button>
          </>
        )}
        
        {currentStep === 'preview' && (
          <>
            <Button variant="outline" onClick={() => setCurrentStep('form')}>
              Back
            </Button>
            <Button variant={config?.variant} onClick={handleExecute}>
              Apply Changes
            </Button>
          </>
        )}
        
        {currentStep === 'results' && (
          <Button onClick={handleClose}>
            Done
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};