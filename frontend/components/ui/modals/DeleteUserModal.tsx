import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Select } from '../atoms/Select';
import { Checkbox } from '../atoms/Checkbox';
import { closeModal } from '@/store/slices/uiSlice';
import { deleteUser, fetchUser } from '@/store/thunks/userThunks';
import { AppDispatch, RootState } from '@/store';
import { User } from '@/types';
import styles from './DeleteUserModal.module.css';
import { FiAlertTriangle, FiInfo, FiUser, FiMail } from 'react-icons/fi';

interface DeleteConsequence {
  icon: React.ReactNode;
  text: string;
}

export const DeleteUserModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const modalState = useSelector((state: RootState) => state.ui.modals.deleteUser);
  const { isOpen, userId } = modalState;
  const [user, setUser] = useState<User | null>(null);
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [reassignData, setReassignData] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState('');
  const [archiveData, setArchiveData] = useState(true);

  // Fetch user data when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      dispatch(fetchUser(userId))
        .unwrap()
        .then((userData) => {
          setUser(userData);
        })
        .catch((error) => {
          console.error('Failed to fetch user:', error);
        });
    }
  }, [isOpen, userId, dispatch]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmInput('');
      setReassignData(false);
      setNewOwnerId('');
      setArchiveData(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!isDeleting) {
      dispatch(closeModal('deleteUser'));
    }
  };

  const handleDelete = async () => {
    if (!user || !userId) return;

    try {
      setIsDeleting(true);
      
      await dispatch(deleteUser({
        userId,
        options: {
          reassignTo: reassignData ? newOwnerId : undefined,
          archive: archiveData
        }
      })).unwrap();
      
      dispatch(closeModal('deleteUser'));
      
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const consequences: DeleteConsequence[] = [
    {
      icon: <FiUser />,
      text: 'All user data will be permanently removed'
    },
    {
      icon: <FiMail />,
      text: 'Access to the system will be immediately revoked'
    },
    {
      icon: <FiAlertTriangle />,
      text: 'Associated records may be affected'
    }
  ];

  const expectedConfirmText = user?.email || 'DELETE';
  const isConfirmationValid = confirmInput.toLowerCase() === expectedConfirmText.toLowerCase();

  if (!user) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      closeOnOverlayClick={false}
    >
      <ModalHeader>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <FiAlertTriangle className={styles.warningIcon} />
          </div>
          <h2 className={styles.title}>Delete User Account</h2>
        </div>
      </ModalHeader>
      
      <ModalBody>
        <div className={styles.content}>
          <div className={styles.userInfo}>
            <p className={styles.message}>
              Are you sure you want to delete the account for{' '}
              <span className={styles.userName}>{user.fullName}</span>?
            </p>
            <div className={styles.userDetails}>
              <span className={styles.detail}>
                <FiMail /> {user.email}
              </span>
              <span className={styles.detail}>
                Role: {user.role.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          <div className={styles.consequences}>
            <h3 className={styles.consequencesTitle}>This action will:</h3>
            <ul className={styles.consequencesList}>
              {consequences.map((consequence, index) => (
                <li key={index} className={styles.consequenceItem}>
                  {consequence.icon}
                  <span>{consequence.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.options}>
            <Checkbox
              checked={archiveData}
              onChange={setArchiveData}
              label="Archive user data for future reference"
            />
            
            <Checkbox
              checked={reassignData}
              onChange={setReassignData}
              label="Reassign ownership of records to another user"
            />
            
            {reassignData && (
              <div className={styles.reassignField}>
                <Select
                  value={newOwnerId}
                  onChange={(e) => setNewOwnerId(e.target.value)}
                  placeholder="Select new owner"
                  options={[
                    // This would be populated with actual users
                    { value: '1', label: 'John Admin' },
                    { value: '2', label: 'Jane Manager' }
                  ]}
                />
              </div>
            )}
          </div>

          <div className={styles.confirmSection}>
            <label className={styles.confirmLabel}>
              To confirm, type{' '}
              <span className={styles.confirmText}>{expectedConfirmText}</span>{' '}
              below:
            </label>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={`Type ${expectedConfirmText} to confirm`}
              autoComplete="off"
              data-lpignore="true"
            />
          </div>

          <div className={styles.infoBox}>
            <FiInfo className={styles.infoIcon} />
            <p className={styles.infoText}>
              This action cannot be undone. Please ensure you have reviewed all 
              implications before proceeding.
            </p>
          </div>
        </div>
      </ModalBody>
      
      <ModalFooter>
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        
        <Button
          variant="danger"
          onClick={handleDelete}
          disabled={!isConfirmationValid || isDeleting || (reassignData && !newOwnerId)}
          loading={isDeleting}
        >
          Delete User
        </Button>
      </ModalFooter>
    </Modal>
  );
};