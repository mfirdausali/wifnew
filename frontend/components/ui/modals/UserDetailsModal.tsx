import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, ModalHeader, ModalBody } from './Modal';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Spinner } from '../atoms/Spinner';
import { Avatar } from '../atoms/Avatar';
import { openModal, closeModal } from '@/store/slices/uiSlice';
import { fetchUser } from '@/store/thunks/userThunks';
import { AppDispatch, RootState } from '@/store';
import { User, ActivityLog } from '@/types';
import styles from './UserDetailsModal.module.css';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiShield,
  FiActivity,
  FiMonitor,
  FiEdit3,
  FiTrash2,
  FiLock,
  FiLogIn,
  FiSettings
} from 'react-icons/fi';

interface DetailSection {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const sections: DetailSection[] = [
  { id: 'overview', title: 'Overview', icon: <FiUser /> },
  { id: 'access', title: 'Access & Permissions', icon: <FiShield /> },
  { id: 'activity', title: 'Activity Log', icon: <FiActivity /> },
  { id: 'sessions', title: 'Active Sessions', icon: <FiMonitor /> },
  { id: 'settings', title: 'Settings', icon: <FiSettings /> }
];

const OverviewSection: React.FC<{ user: User }> = ({ user }) => {
  const department = useSelector((state: RootState) => 
    state.departments.list.find(d => d.id === user.departmentId)
  );

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'purple',
      sales_manager: 'blue',
      finance_manager: 'green',
      operations_manager: 'orange'
    };
    return colors[role as keyof typeof colors] || 'gray';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'success',
      inactive: 'warning',
      suspended: 'danger'
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  const getAccessLevelLabel = (level: number) => {
    const labels = ['Basic', 'Standard', 'Enhanced', 'Manager', 'Executive'];
    return labels[level - 1] || 'Unknown';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  return (
    <div className={styles.overviewSection}>
      {/* User Profile Header */}
      <div className={styles.profileHeader}>
        <Avatar
          name={user.fullName}
          src={user.avatarUrl}
          size="xl"
        />
        <div className={styles.profileInfo}>
          <h3>{user.fullName}</h3>
          <p>{user.position || 'No position set'}</p>
          <div className={styles.badges}>
            <Badge variant={getRoleColor(user.role)} size="sm">
              {user.role.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge variant={getStatusColor(user.status)} size="sm">
              {user.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className={styles.infoCard}>
        <h4>Contact Information</h4>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <FiMail className={styles.infoIcon} />
            <div>
              <span className={styles.infoLabel}>Email</span>
              <a href={`mailto:${user.email}`} className={styles.infoValue}>
                {user.email}
              </a>
            </div>
          </div>
          
          <div className={styles.infoItem}>
            <FiPhone className={styles.infoIcon} />
            <div>
              <span className={styles.infoLabel}>Phone</span>
              <span className={styles.infoValue}>
                {user.phoneNumber || 'Not provided'}
              </span>
            </div>
          </div>
          
          <div className={styles.infoItem}>
            <FiBriefcase className={styles.infoIcon} />
            <div>
              <span className={styles.infoLabel}>Department</span>
              <span className={styles.infoValue}>
                {department?.name || 'Not assigned'}
              </span>
            </div>
          </div>
          
          <div className={styles.infoItem}>
            <FiMapPin className={styles.infoIcon} />
            <div>
              <span className={styles.infoLabel}>Location</span>
              <span className={styles.infoValue}>
                San Francisco, CA
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Employment Details */}
      <div className={styles.infoCard}>
        <h4>Employment Details</h4>
        <div className={styles.detailsList}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Employee ID</span>
            <span className={styles.detailValue}>{user.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Join Date</span>
            <span className={styles.detailValue}>{formatDate(user.createdAt)}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Access Level</span>
            <span className={styles.detailValue}>
              {getAccessLevelLabel(user.accessLevel)} (Level {user.accessLevel})
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Last Login</span>
            <span className={styles.detailValue}>
              {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <FiLogIn className={styles.statIcon} />
          <div>
            <span className={styles.statValue}>142</span>
            <span className={styles.statLabel}>Total Logins</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <FiMonitor className={styles.statIcon} />
          <div>
            <span className={styles.statValue}>3</span>
            <span className={styles.statLabel}>Active Sessions</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <FiShield className={styles.statIcon} />
          <div>
            <span className={styles.statValue}>{user.permissions?.length || 0}</span>
            <span className={styles.statLabel}>Permissions</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <FiCalendar className={styles.statIcon} />
          <div>
            <span className={styles.statValue}>
              {Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
            </span>
            <span className={styles.statLabel}>Days Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const AccessSection: React.FC<{ user: User }> = ({ user }) => {
  const permissions = useSelector((state: RootState) => state.permissions.available);
  const userPermissions = permissions.filter(p => user.permissions?.includes(p.id));
  
  const groupedPermissions = userPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, typeof permissions>);

  return (
    <div className={styles.accessSection}>
      {/* Role & Access Level */}
      <div className={styles.infoCard}>
        <h4>Role & Access Level</h4>
        <div className={styles.roleInfo}>
          <div className={styles.roleItem}>
            <span className={styles.roleLabel}>Current Role</span>
            <div className={styles.roleValue}>
              <Badge variant="purple" size="lg">
                {user.role.replace('_', ' ').toUpperCase()}
              </Badge>
              <p className={styles.roleDescription}>
                Full system administration access with all permissions
              </p>
            </div>
          </div>
          
          <div className={styles.accessLevelDisplay}>
            <span className={styles.accessLabel}>Access Level</span>
            <div className={styles.accessMeter}>
              <div 
                className={styles.accessFill} 
                style={{ width: `${(user.accessLevel / 5) * 100}%` }}
              />
              <span className={styles.accessValue}>Level {user.accessLevel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className={styles.infoCard}>
        <h4>Permissions ({userPermissions.length})</h4>
        {Object.entries(groupedPermissions).length > 0 ? (
          <div className={styles.permissionGroups}>
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <div key={category} className={styles.permissionGroup}>
                <h5>{category}</h5>
                <div className={styles.permissionList}>
                  {perms.map(permission => (
                    <div key={permission.id} className={styles.permissionItem}>
                      <FiShield className={styles.permissionIcon} />
                      <div>
                        <span className={styles.permissionName}>{permission.name}</span>
                        <span className={styles.permissionDesc}>{permission.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyMessage}>No additional permissions assigned</p>
        )}
      </div>
    </div>
  );
};

const ActivitySection: React.FC<{ userId: string }> = ({ userId }) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching activity logs
    setTimeout(() => {
      setActivities([
        {
          id: '1',
          userId,
          action: 'user.login',
          resource: 'auth',
          resourceId: userId,
          details: { browser: 'Chrome', os: 'macOS' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          userId,
          action: 'user.update',
          resource: 'profile',
          resourceId: userId,
          details: { fields: ['phone', 'position'] },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          timestamp: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
      setLoading(false);
    }, 1000);
  }, [userId]);

  const getActionIcon = (action: string) => {
    const icons: Record<string, React.ReactNode> = {
      'user.login': <FiLogIn />,
      'user.logout': <FiLogIn style={{ transform: 'rotate(180deg)' }} />,
      'user.update': <FiEdit3 />,
      'user.password_reset': <FiLock />
    };
    return icons[action] || <FiActivity />;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'user.login': 'Logged in',
      'user.logout': 'Logged out',
      'user.update': 'Updated profile',
      'user.password_reset': 'Reset password'
    };
    return labels[action] || action;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={styles.activitySection}>
      <div className={styles.activityTimeline}>
        {activities.map((activity, index) => (
          <div key={activity.id} className={styles.activityItem}>
            <div className={styles.activityIcon}>
              {getActionIcon(activity.action)}
            </div>
            <div className={styles.activityContent}>
              <div className={styles.activityHeader}>
                <span className={styles.activityAction}>
                  {getActionLabel(activity.action)}
                </span>
                <span className={styles.activityTime}>
                  {formatTimestamp(activity.timestamp)}
                </span>
              </div>
              <div className={styles.activityDetails}>
                <span>IP: {activity.ipAddress}</span>
                {activity.details.browser && (
                  <span> • {activity.details.browser} on {activity.details.os}</span>
                )}
              </div>
            </div>
            {index < activities.length - 1 && <div className={styles.activityLine} />}
          </div>
        ))}
      </div>
      
      <Button variant="outline" size="sm" className={styles.loadMoreButton}>
        Load More Activities
      </Button>
    </div>
  );
};

export const UserDetailsModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const modalState = useSelector((state: RootState) => state.ui.modals.editUser);
  const { isOpen, userId } = modalState;
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      dispatch(fetchUser(userId))
        .unwrap()
        .then((userData) => {
          setUser(userData);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [isOpen, userId, dispatch]);

  const handleClose = () => {
    dispatch(closeModal('editUser'));
    setActiveSection('overview');
  };

  const handleEdit = () => {
    dispatch(closeModal('editUser'));
    dispatch(openModal({ modal: 'editUser', data: { userId } }));
  };

  const handleDelete = () => {
    dispatch(closeModal('editUser'));
    dispatch(openModal({ modal: 'deleteUser', data: { userId } }));
  };

  const renderSection = () => {
    if (!user) return null;

    switch (activeSection) {
      case 'overview':
        return <OverviewSection user={user} />;
      case 'access':
        return <AccessSection user={user} />;
      case 'activity':
        return <ActivitySection userId={user.id} />;
      case 'sessions':
        return <div className={styles.comingSoon}>Sessions management coming soon</div>;
      case 'settings':
        return <div className={styles.comingSoon}>User settings coming soon</div>;
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
    >
      {loading ? (
        <div className={styles.loadingContainer}>
          <Spinner size="xl" />
        </div>
      ) : user ? (
        <>
          <ModalHeader>
            <div className={styles.modalHeader}>
              <div className={styles.headerInfo}>
                <Avatar name={user.fullName} src={user.avatarUrl} size="md" />
                <div>
                  <h2 className={styles.userName}>{user.fullName}</h2>
                  <p className={styles.userEmail}>{user.email}</p>
                </div>
              </div>
              <div className={styles.headerActions}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  leftIcon={<FiEdit3 />}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  leftIcon={<FiTrash2 />}
                  className={styles.deleteButton}
                >
                  Delete
                </Button>
              </div>
            </div>
            
            <div className={styles.sectionTabs}>
              {sections.map(section => (
                <button
                  key={section.id}
                  className={`${styles.sectionTab} ${
                    activeSection === section.id ? styles.active : ''
                  }`}
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.icon}
                  <span>{section.title}</span>
                </button>
              ))}
            </div>
          </ModalHeader>
          
          <ModalBody>
            {renderSection()}
          </ModalBody>
        </>
      ) : (
        <div className={styles.errorContainer}>
          <p>User not found</p>
        </div>
      )}
    </Modal>
  );
};