import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '../ui/atoms/Button';
import { 
  UserCreateModal, 
  UserDetailsModal, 
  DeleteUserModal, 
  BulkUpdateModal,
  ImportUsersModal 
} from '../ui/modals';
import { openModal } from '@/store/slices/uiSlice';
import { AppDispatch, RootState } from '@/store';
import styles from './ModalsExample.module.css';
import {
  FiUserPlus,
  FiUsers,
  FiUpload,
  FiDownload,
  FiEdit3,
  FiTrash2,
  FiEye
} from 'react-icons/fi';

export const ModalsExample: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const selectedUserIds = useSelector((state: RootState) => state.users.selectedIds);
  
  // Example user ID for demo purposes
  const exampleUserId = 'user-123';

  const handleOpenModal = (modalName: string, data?: any) => {
    dispatch(openModal({ modal: modalName as any, data }));
  };

  return (
    <div className={styles.container}>
      <h1>Modal Components Example</h1>
      <p>Click the buttons below to see different modal components in action.</p>

      <div className={styles.section}>
        <h2>User Management Modals</h2>
        
        <div className={styles.buttonGrid}>
          <Button
            onClick={() => handleOpenModal('createUser')}
            leftIcon={<FiUserPlus />}
          >
            Create New User
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleOpenModal('editUser', { userId: exampleUserId })}
            leftIcon={<FiEye />}
          >
            View User Details
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleOpenModal('deleteUser', { userId: exampleUserId })}
            leftIcon={<FiTrash2 />}
          >
            Delete User
          </Button>
        </div>
      </div>

      <div className={styles.section}>
        <h2>Bulk Operations</h2>
        <p className={styles.note}>
          Select some users from a table first to enable bulk operations
        </p>
        
        <div className={styles.buttonGrid}>
          <Button
            variant="outline"
            onClick={() => handleOpenModal('bulkAction', { action: 'update_status' })}
            disabled={selectedUserIds.length === 0}
            leftIcon={<FiUsers />}
          >
            Bulk Update Status
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleOpenModal('bulkAction', { action: 'update_role' })}
            disabled={selectedUserIds.length === 0}
            leftIcon={<FiUsers />}
          >
            Bulk Update Role
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleOpenModal('bulkAction', { action: 'update_department' })}
            disabled={selectedUserIds.length === 0}
            leftIcon={<FiUsers />}
          >
            Bulk Update Department
          </Button>
        </div>
      </div>

      <div className={styles.section}>
        <h2>Import & Export</h2>
        
        <div className={styles.buttonGrid}>
          <Button
            variant="outline"
            onClick={() => handleOpenModal('importUsers')}
            leftIcon={<FiUpload />}
          >
            Import Users
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleOpenModal('exportUsers')}
            leftIcon={<FiDownload />}
            disabled
          >
            Export Users (Coming Soon)
          </Button>
        </div>
      </div>

      <div className={styles.section}>
        <h2>Modal Features</h2>
        <ul className={styles.features}>
          <li>✓ Fully accessible with focus trap and keyboard navigation</li>
          <li>✓ Smooth animations with Framer Motion</li>
          <li>✓ Responsive design for mobile devices</li>
          <li>✓ Integration with Redux state management</li>
          <li>✓ Form validation and error handling</li>
          <li>✓ Loading states and progress indicators</li>
          <li>✓ Dark mode support</li>
          <li>✓ Draggable modals (optional)</li>
          <li>✓ ESC key to close</li>
          <li>✓ Click outside to close (configurable)</li>
        </ul>
      </div>

      {/* Modal Components */}
      <UserCreateModal />
      <UserDetailsModal />
      <DeleteUserModal />
      <BulkUpdateModal />
      <ImportUsersModal />
    </div>
  );
};

// Usage in a page or parent component:
// import { ModalsExample } from '@/components/examples/ModalsExample';
// 
// function MyPage() {
//   return (
//     <div>
//       <ModalsExample />
//     </div>
//   );
// }