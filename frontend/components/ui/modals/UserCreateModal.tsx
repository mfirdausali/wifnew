import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Select } from '../atoms/Select';
import { Checkbox } from '../atoms/Checkbox';
import { Radio } from '../atoms/Radio';
import { Spinner } from '../atoms/Spinner';
import { openModal, closeModal } from '@/store/slices/uiSlice';
import { createUser } from '@/store/thunks/userThunks';
import { AppDispatch, RootState } from '@/store';
import { UserRole, CreateUserDTO } from '@/types';
import styles from './UserCreateModal.module.css';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiShield,
  FiLock,
  FiChevronRight,
  FiChevronLeft,
  FiUserPlus,
  FiRotateCcw,
  FiInfo,
  FiEye,
  FiEyeOff,
  FiRefreshCw
} from 'react-icons/fi';

interface UserCreateForm {
  // Personal Information
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone?: string;
  
  // Professional Details
  position: string;
  departmentId: string;
  managerId?: string;
  employmentDate: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'intern';
  
  // Access Configuration
  role: UserRole;
  accessLevel: number;
  permissions?: string[];
  restrictedDepartments?: string[];
  
  // Security
  password: string;
  confirmPassword: string;
  requirePasswordChange: boolean;
  sendWelcomeEmail: boolean;
  
  // Additional
  timezone?: string;
  language?: string;
  notes?: string;
}

interface StepProps {
  formData: Partial<UserCreateForm>;
  errors: any;
  onChange: (field: string, value: any) => void;
  register: any;
  watch: any;
}

const steps = [
  { id: 'personal', title: 'Personal Information', icon: FiUser },
  { id: 'professional', title: 'Professional Details', icon: FiBriefcase },
  { id: 'access', title: 'Access & Permissions', icon: FiShield },
  { id: 'security', title: 'Security Setup', icon: FiLock }
];

// Step Components
const PersonalInfoStep: React.FC<StepProps> = ({ register, errors, watch }) => {
  return (
    <div className={styles.stepContent}>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <Input
            {...register('firstName', { required: 'First name is required' })}
            label="First Name"
            error={errors.firstName?.message}
            autoFocus
          />
        </div>
        
        <div className={styles.formField}>
          <Input
            {...register('lastName', { required: 'Last name is required' })}
            label="Last Name"
            error={errors.lastName?.message}
          />
        </div>
      </div>
      
      <div className={styles.formField}>
        <Input
          {...register('middleName')}
          label="Middle Name (Optional)"
          error={errors.middleName?.message}
        />
      </div>
      
      <div className={styles.formField}>
        <Input
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
          type="email"
          label="Email Address"
          error={errors.email?.message}
          leftIcon={<FiMail />}
          helper="This will be used for login and notifications"
        />
      </div>
      
      <div className={styles.formField}>
        <Input
          {...register('phone')}
          type="tel"
          label="Phone Number (Optional)"
          error={errors.phone?.message}
          leftIcon={<FiPhone />}
          placeholder="+1 (555) 123-4567"
        />
      </div>
    </div>
  );
};

const ProfessionalDetailsStep: React.FC<StepProps> = ({ register, errors, watch }) => {
  const departments = useSelector((state: RootState) => state.departments.list);
  const users = useSelector((state: RootState) => state.users.list);
  const selectedDepartmentId = watch('departmentId');
  
  // Filter managers based on selected department
  const managers = users.filter(user => 
    user.departmentId === selectedDepartmentId && 
    ['admin', 'sales_manager', 'finance_manager', 'operations_manager'].includes(user.role)
  );

  return (
    <div className={styles.stepContent}>
      <div className={styles.formField}>
        <Input
          {...register('position', { required: 'Position is required' })}
          label="Position / Job Title"
          error={errors.position?.message}
          placeholder="e.g., Senior Software Engineer"
        />
      </div>
      
      <div className={styles.formField}>
        <Select
          {...register('departmentId', { required: 'Department is required' })}
          label="Department"
          error={errors.departmentId?.message}
          options={departments.map(dept => ({
            value: dept.id,
            label: dept.name
          }))}
          placeholder="Select department"
        />
      </div>
      
      <div className={styles.formField}>
        <Select
          {...register('managerId')}
          label="Manager (Optional)"
          error={errors.managerId?.message}
          options={managers.map(user => ({
            value: user.id,
            label: user.fullName
          }))}
          placeholder="Select manager"
          disabled={!selectedDepartmentId}
        />
      </div>
      
      <div className={styles.formField}>
        <Input
          {...register('employmentDate', { required: 'Employment date is required' })}
          type="date"
          label="Employment Date"
          error={errors.employmentDate?.message}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>
      
      <div className={styles.formField}>
        <label className={styles.label}>Employment Type</label>
        <div className={styles.radioGroup}>
          <Radio
            {...register('employmentType', { required: 'Employment type is required' })}
            value="full_time"
            label="Full Time"
          />
          <Radio
            {...register('employmentType')}
            value="part_time"
            label="Part Time"
          />
          <Radio
            {...register('employmentType')}
            value="contract"
            label="Contract"
          />
          <Radio
            {...register('employmentType')}
            value="intern"
            label="Intern"
          />
        </div>
        {errors.employmentType && (
          <span className={styles.error}>{errors.employmentType.message}</span>
        )}
      </div>
    </div>
  );
};

const AccessConfigStep: React.FC<StepProps> = ({ register, errors, watch, onChange }) => {
  const permissions = useSelector((state: RootState) => state.permissions.available);
  const selectedRole = watch('role');
  const selectedPermissions = watch('permissions') || [];

  const roles: Array<{ value: UserRole; label: string; description: string }> = [
    { value: 'admin', label: 'Administrator', description: 'Full system access' },
    { value: 'sales_manager', label: 'Sales Manager', description: 'Sales team management' },
    { value: 'finance_manager', label: 'Finance Manager', description: 'Finance operations access' },
    { value: 'operations_manager', label: 'Operations Manager', description: 'Operations management' }
  ];

  const accessLevels = [
    { value: 1, label: 'Basic', description: 'View only access' },
    { value: 2, label: 'Standard', description: 'View and edit own data' },
    { value: 3, label: 'Enhanced', description: 'Department-wide access' },
    { value: 4, label: 'Manager', description: 'Team management access' },
    { value: 5, label: 'Executive', description: 'Full organizational access' }
  ];

  return (
    <div className={styles.stepContent}>
      <div className={styles.formField}>
        <label className={styles.label}>User Role</label>
        <div className={styles.roleGrid}>
          {roles.map(role => (
            <div
              key={role.value}
              className={`${styles.roleCard} ${selectedRole === role.value ? styles.selected : ''}`}
              onClick={() => onChange('role', role.value)}
            >
              <h4>{role.label}</h4>
              <p>{role.description}</p>
            </div>
          ))}
        </div>
        {errors.role && (
          <span className={styles.error}>{errors.role.message}</span>
        )}
      </div>
      
      <div className={styles.formField}>
        <label className={styles.label}>Access Level</label>
        <div className={styles.accessLevelSlider}>
          <input
            {...register('accessLevel', { required: 'Access level is required' })}
            type="range"
            min="1"
            max="5"
            step="1"
            className={styles.slider}
          />
          <div className={styles.sliderLabels}>
            {accessLevels.map(level => (
              <div key={level.value} className={styles.sliderLabel}>
                <span>{level.label}</span>
              </div>
            ))}
          </div>
        </div>
        {errors.accessLevel && (
          <span className={styles.error}>{errors.accessLevel.message}</span>
        )}
      </div>
      
      <div className={styles.formField}>
        <label className={styles.label}>Additional Permissions</label>
        <div className={styles.permissionGrid}>
          {permissions.map(permission => (
            <Checkbox
              key={permission.id}
              label={permission.name}
              checked={selectedPermissions.includes(permission.id)}
              onChange={(checked) => {
                const newPermissions = checked
                  ? [...selectedPermissions, permission.id]
                  : selectedPermissions.filter((p: string) => p !== permission.id);
                onChange('permissions', newPermissions);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const SecuritySetupStep: React.FC<StepProps> = ({ register, errors, watch, onChange }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const password = watch('password');
  const confirmPassword = watch('confirmPassword');
  
  // Password strength calculation
  const calculatePasswordStrength = (password: string) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };
  
  const passwordStrength = calculatePasswordStrength(password);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const strengthColors = ['#ef4444', '#f59e0b', '#eab308', '#84cc16', '#22c55e'];

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    onChange('password', password);
    onChange('confirmPassword', password);
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.formField}>
        <div className={styles.passwordFieldWrapper}>
          <Input
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters'
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                message: 'Password must contain uppercase, lowercase, number and special character'
              }
            })}
            type={showPassword ? 'text' : 'password'}
            label="Password"
            error={errors.password?.message}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.passwordToggle}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            }
          />
          <button
            type="button"
            onClick={generatePassword}
            className={styles.generateButton}
          >
            <FiRefreshCw /> Generate
          </button>
        </div>
        
        {password && (
          <div className={styles.passwordStrength}>
            <div className={styles.strengthBar}>
              <div
                className={styles.strengthFill}
                style={{
                  width: `${(passwordStrength / 5) * 100}%`,
                  backgroundColor: strengthColors[passwordStrength - 1]
                }}
              />
            </div>
            <span style={{ color: strengthColors[passwordStrength - 1] }}>
              {strengthLabels[passwordStrength - 1]}
            </span>
          </div>
        )}
      </div>
      
      <div className={styles.formField}>
        <Input
          {...register('confirmPassword', {
            required: 'Please confirm password',
            validate: value => value === password || 'Passwords do not match'
          })}
          type={showConfirmPassword ? 'text' : 'password'}
          label="Confirm Password"
          error={errors.confirmPassword?.message}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className={styles.passwordToggle}
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          }
        />
      </div>
      
      <div className={styles.securityOptions}>
        <Checkbox
          {...register('requirePasswordChange')}
          label="Require password change on first login"
        />
        
        <Checkbox
          {...register('sendWelcomeEmail')}
          label="Send welcome email with login instructions"
          defaultChecked
        />
      </div>
      
      <div className={styles.infoBox}>
        <FiInfo />
        <div>
          <h4>Password Requirements</h4>
          <ul>
            <li>Minimum 8 characters</li>
            <li>At least one uppercase letter</li>
            <li>At least one lowercase letter</li>
            <li>At least one number</li>
            <li>At least one special character</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export const UserCreateModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isOpen = useSelector((state: RootState) => state.ui.modals.createUser);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset
  } = useForm<UserCreateForm>({
    defaultValues: {
      employmentType: 'full_time',
      role: 'sales_manager',
      accessLevel: 2,
      requirePasswordChange: false,
      sendWelcomeEmail: true
    }
  });

  // Check for saved draft
  useEffect(() => {
    const savedDraft = localStorage.getItem('userCreateDraft');
    if (savedDraft && isOpen) {
      const draft = JSON.parse(savedDraft);
      Object.entries(draft).forEach(([key, value]) => {
        setValue(key as keyof UserCreateForm, value);
      });
    }
  }, [isOpen, setValue]);

  // Auto-save draft
  useEffect(() => {
    if (isDirty) {
      const timer = setTimeout(() => {
        const formData = watch();
        localStorage.setItem('userCreateDraft', JSON.stringify(formData));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [watch, isDirty]);

  const handleClose = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        dispatch(closeModal('createUser'));
        reset();
        setCurrentStep(0);
      }
    } else {
      dispatch(closeModal('createUser'));
      reset();
      setCurrentStep(0);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setValue(field as keyof UserCreateForm, value);
  };

  const onSubmit = async (data: UserCreateForm) => {
    try {
      setIsSubmitting(true);
      
      // Prepare data for API
      const createUserData: CreateUserDTO = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName}`,
        role: data.role,
        departmentId: data.departmentId,
        position: data.position,
        phoneNumber: data.phone,
        permissions: data.permissions
      };
      
      await dispatch(createUser(createUserData)).unwrap();
      
      // Clear draft
      localStorage.removeItem('userCreateDraft');
      
      // Close modal and reset form
      dispatch(closeModal('createUser'));
      reset();
      setCurrentStep(0);
      
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    const stepProps = {
      formData: watch(),
      errors,
      onChange: handleFieldChange,
      register,
      watch
    };

    switch (currentStep) {
      case 0:
        return <PersonalInfoStep {...stepProps} />;
      case 1:
        return <ProfessionalDetailsStep {...stepProps} />;
      case 2:
        return <AccessConfigStep {...stepProps} />;
      case 3:
        return <SecuritySetupStep {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      closeOnOverlayClick={false}
      closeOnEsc={!isDirty}
    >
      <ModalHeader>
        <h2 className={styles.modalTitle}>Create New User</h2>
        <div className={styles.stepIndicator}>
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`${styles.step} ${
                index === currentStep ? styles.active : ''
              } ${index < currentStep ? styles.completed : ''}`}
            >
              <div className={styles.stepIcon}>
                <step.icon />
              </div>
              <span className={styles.stepTitle}>{step.title}</span>
            </div>
          ))}
        </div>
      </ModalHeader>
      
      <ModalBody>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </ModalBody>
      
      <ModalFooter>
        <div className={styles.footerContent}>
          <div className={styles.footerLeft}>
            {isDirty && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const draft = localStorage.getItem('userCreateDraft');
                  if (draft) {
                    const draftData = JSON.parse(draft);
                    Object.entries(draftData).forEach(([key, value]) => {
                      setValue(key as keyof UserCreateForm, value);
                    });
                  }
                }}
                leftIcon={<FiRotateCcw />}
              >
                Restore Draft
              </Button>
            )}
          </div>
          
          <div className={styles.footerRight}>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isSubmitting}
                leftIcon={<FiChevronLeft />}
              >
                Previous
              </Button>
            )}
            
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={isSubmitting}
                rightIcon={<FiChevronRight />}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit(onSubmit)}
                loading={isSubmitting}
                leftIcon={<FiUserPlus />}
              >
                Create User
              </Button>
            )}
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
};