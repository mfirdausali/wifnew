# Users Management - Modal Components Detailed Specification

## Overview
This document provides comprehensive specifications for all modal components in the Users Management feature, including user creation, editing, viewing, and confirmation dialogs.

## Table of Contents
1. [UserCreateModal Component](#userCreateModal-component)
2. [UserEditModal Component](#usereditmodal-component)
3. [UserDetailsModal Component](#userdetailsmodal-component)
4. [DeleteConfirmationModal Component](#deleteconfirmationmodal-component)
5. [BulkActionModal Component](#bulkactionmodal-component)
6. [ImportUsersModal Component](#importusersmodal-component)
7. [ExportOptionsModal Component](#exportoptionsmodal-component)
8. [PermissionsModal Component](#permissionsmodal-component)
9. [PasswordResetModal Component](#passwordresetmodal-component)
10. [Modal Base Components](#modal-base-components)

---

## 1. UserCreateModal Component

### 1.1 Complete TypeScript Interface
```typescript
interface UserCreateModalProps {
  // Modal state
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: User) => void;
  onError?: (error: Error) => void;
  
  // Initial data
  defaultValues?: Partial<UserCreateForm>;
  department?: Department;
  manager?: User;
  
  // Configuration
  steps?: CreateUserStep[];
  skipSteps?: string[];
  requiredFields?: string[];
  customFields?: CustomField[];
  
  // Validation
  validationRules?: ValidationRules;
  asyncValidators?: AsyncValidators;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  
  // UI options
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showProgress?: boolean;
  allowDraftSave?: boolean;
  showPasswordStrength?: boolean;
  
  // Permissions
  canSetRole?: boolean;
  canSetAccessLevel?: boolean;
  canSetDepartment?: boolean;
  canBypassPasswordPolicy?: boolean;
  
  // Callbacks
  onStepChange?: (step: number, data: Partial<UserCreateForm>) => void;
  onFieldChange?: (field: string, value: any) => void;
  onValidationError?: (errors: ValidationError[]) => void;
  beforeSubmit?: (data: UserCreateForm) => Promise<UserCreateForm>;
  
  // Advanced
  customStepRenderer?: (step: CreateUserStep) => React.ReactNode;
  customValidation?: (data: UserCreateForm) => ValidationResult;
  transformSubmitData?: (data: UserCreateForm) => any;
}

interface CreateUserStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  validation?: StepValidation;
  isOptional?: boolean;
  dependsOn?: string[];
}

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
  employmentDate: Date;
  employmentType: EmploymentType;
  
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
```

### 1.2 Component Implementation
```typescript
const UserCreateModal: React.FC<UserCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  defaultValues,
  steps = defaultCreateSteps,
  size = 'lg',
  showProgress = true,
  allowDraftSave = true,
  showPasswordStrength = true,
  ...props
}) => {
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<UserCreateForm>>(
    defaultValues || {}
  );
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draft, setDraft] = useState<Partial<UserCreateForm> | null>(null);
  
  // Form handling
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors: formErrors, isDirty }
  } = useForm<UserCreateForm>({
    defaultValues,
    mode: props.validateOnChange ? 'onChange' : 'onBlur'
  });
  
  // Auto-save draft
  useEffect(() => {
    if (allowDraftSave && isDirty) {
      const timer = setTimeout(() => {
        localStorage.setItem('userCreateDraft', JSON.stringify(formData));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData, allowDraftSave, isDirty]);
  
  // Step navigation
  const handleNext = async () => {
    const stepData = getStepData(currentStep);
    const validation = await validateStep(stepData);
    
    if (validation.isValid) {
      setFormData({ ...formData, ...stepData });
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        props.onStepChange?.(currentStep + 1, formData);
      } else {
        handleFormSubmit();
      }
    } else {
      setErrors(validation.errors);
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      props.onStepChange?.(currentStep - 1, formData);
    }
  };
  
  // Form submission
  const handleFormSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Custom validation
      if (props.customValidation) {
        const validation = props.customValidation(formData as UserCreateForm);
        if (!validation.isValid) {
          setErrors(validation.errors);
          return;
        }
      }
      
      // Transform data
      let submitData = formData;
      if (props.beforeSubmit) {
        submitData = await props.beforeSubmit(formData as UserCreateForm);
      }
      if (props.transformSubmitData) {
        submitData = props.transformSubmitData(submitData as UserCreateForm);
      }
      
      // API call
      const response = await createUser(submitData);
      
      // Clear draft
      if (allowDraftSave) {
        localStorage.removeItem('userCreateDraft');
      }
      
      // Success callback
      onSuccess?.(response.data);
      toast.success('User created successfully');
      onClose();
      
    } catch (error) {
      console.error('Error creating user:', error);
      onError?.(error as Error);
      toast.error('Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      closeOnOverlayClick={false}
      closeOnEsc={!isDirty}
    >
      <ModalHeader>
        <h2 className="text-xl font-semibold">Create New User</h2>
        {showProgress && (
          <StepProgress
            steps={steps.map(s => s.title)}
            currentStep={currentStep}
            className="mt-4"
          />
        )}
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
            {renderStep(steps[currentStep])}
          </motion.div>
        </AnimatePresence>
      </ModalBody>
      
      <ModalFooter>
        <div className="flex items-center justify-between w-full">
          <div>
            {allowDraftSave && draft && (
              <Button
                variant="ghost"
                size="sm"
                onClick={loadDraft}
                leftIcon={<FiRotateCcw />}
              >
                Restore Draft
              </Button>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
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
                onClick={handleFormSubmit}
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
```

### 1.3 Step Components

#### Personal Information Step
```typescript
const PersonalInfoStep: React.FC<StepProps> = ({ formData, errors, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="First Name"
          name="firstName"
          value={formData.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
          error={errors.firstName}
          required
          autoFocus
        />
        
        <Input
          label="Last Name"
          name="lastName"
          value={formData.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          error={errors.lastName}
          required
        />
      </div>
      
      <Input
        label="Middle Name"
        name="middleName"
        value={formData.middleName}
        onChange={(e) => onChange('middleName', e.target.value)}
        error={errors.middleName}
      />
      
      <Input
        label="Email Address"
        name="email"
        type="email"
        value={formData.email}
        onChange={(e) => onChange('email', e.target.value)}
        error={errors.email}
        required
        leftIcon={<FiMail />}
        helper="This will be used for login and notifications"
      />
      
      <PhoneInput
        label="Phone Number"
        name="phone"
        value={formData.phone}
        onChange={(value) => onChange('phone', value)}
        error={errors.phone}
        country="US"
      />
    </div>
  );
};
```

#### Professional Details Step
```typescript
const ProfessionalDetailsStep: React.FC<StepProps> = ({ 
  formData, 
  errors, 
  onChange 
}) => {
  const { data: departments } = useDepartments();
  const { data: managers } = useManagers(formData.departmentId);
  
  return (
    <div className="space-y-6">
      <Input
        label="Position"
        name="position"
        value={formData.position}
        onChange={(e) => onChange('position', e.target.value)}
        error={errors.position}
        required
        placeholder="e.g., Senior Software Engineer"
      />
      
      <DepartmentPicker
        label="Department"
        value={formData.departmentId}
        onChange={(value) => onChange('departmentId', value)}
        error={errors.departmentId}
        departments={departments}
        required
        showHierarchy
      />
      
      <UserPicker
        label="Manager"
        value={formData.managerId}
        onChange={(value) => onChange('managerId', value)}
        error={errors.managerId}
        users={managers}
        placeholder="Select manager (optional)"
        allowClear
      />
      
      <DatePicker
        label="Employment Date"
        value={formData.employmentDate}
        onChange={(date) => onChange('employmentDate', date)}
        error={errors.employmentDate}
        required
        maxDate={new Date()}
      />
      
      <RadioGroup
        label="Employment Type"
        name="employmentType"
        value={formData.employmentType}
        onChange={(value) => onChange('employmentType', value)}
        error={errors.employmentType}
        options={[
          { value: 'full_time', label: 'Full Time' },
          { value: 'part_time', label: 'Part Time' },
          { value: 'contract', label: 'Contract' },
          { value: 'intern', label: 'Intern' }
        ]}
        required
      />
    </div>
  );
};
```

#### Access Configuration Step
```typescript
const AccessConfigStep: React.FC<StepProps> = ({ 
  formData, 
  errors, 
  onChange,
  permissions 
}) => {
  const { canSetRole, canSetAccessLevel } = permissions;
  
  return (
    <div className="space-y-6">
      <RolePicker
        label="User Role"
        value={formData.role}
        onChange={(value) => onChange('role', value)}
        error={errors.role}
        required
        disabled={!canSetRole}
        showDescriptions
      />
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Access Level
        </label>
        <AccessLevelSlider
          value={formData.accessLevel}
          onChange={(value) => onChange('accessLevel', value)}
          disabled={!canSetAccessLevel}
          showLabels
          showTooltips
        />
        {errors.accessLevel && (
          <p className="text-sm text-red-600 mt-1">{errors.accessLevel}</p>
        )}
      </div>
      
      <PermissionMatrix
        role={formData.role}
        selectedPermissions={formData.permissions}
        onChange={(permissions) => onChange('permissions', permissions)}
        error={errors.permissions}
        groupByCategory
        showInherited
      />
      
      <DepartmentRestrictions
        value={formData.restrictedDepartments}
        onChange={(value) => onChange('restrictedDepartments', value)}
        error={errors.restrictedDepartments}
        currentDepartment={formData.departmentId}
      />
    </div>
  );
};
```

#### Password Setup Step
```typescript
const PasswordSetupStep: React.FC<StepProps> = ({ 
  formData, 
  errors, 
  onChange,
  showPasswordStrength 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const passwordStrength = usePasswordStrength(formData.password);
  
  return (
    <div className="space-y-6">
      <PasswordField
        label="Password"
        name="password"
        value={formData.password}
        onChange={(e) => onChange('password', e.target.value)}
        error={errors.password}
        required
        showToggle
        autoComplete="new-password"
      />
      
      {showPasswordStrength && formData.password && (
        <PasswordStrengthMeter
          password={formData.password}
          requirements={passwordRequirements}
          strength={passwordStrength}
        />
      )}
      
      <PasswordField
        label="Confirm Password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={(e) => onChange('confirmPassword', e.target.value)}
        error={errors.confirmPassword}
        required
        showToggle
        autoComplete="new-password"
      />
      
      <Checkbox
        label="Require password change on first login"
        checked={formData.requirePasswordChange}
        onChange={(checked) => onChange('requirePasswordChange', checked)}
      />
      
      <Checkbox
        label="Send welcome email with login instructions"
        checked={formData.sendWelcomeEmail}
        onChange={(checked) => onChange('sendWelcomeEmail', checked)}
      />
      
      <Alert variant="info" icon={<FiInfo />}>
        <AlertTitle>Password Requirements</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>Minimum 8 characters</li>
            <li>At least one uppercase letter</li>
            <li>At least one lowercase letter</li>
            <li>At least one number</li>
            <li>At least one special character</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};
```

---

## 2. UserEditModal Component

### 2.1 Complete TypeScript Interface
```typescript
interface UserEditModalProps {
  // Modal state
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: User) => void;
  onError?: (error: Error) => void;
  
  // User data
  user: User;
  editableFields?: string[];
  lockedFields?: string[];
  
  // Configuration
  tabs?: EditUserTab[];
  defaultTab?: string;
  showActivityLog?: boolean;
  showPermissionHistory?: boolean;
  
  // Validation
  validationRules?: ValidationRules;
  validateOnChange?: boolean;
  requireConfirmation?: boolean;
  confirmationMessage?: string;
  
  // UI options
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  allowInlineEdit?: boolean;
  showChangeIndicators?: boolean;
  compareWithOriginal?: boolean;
  
  // Permissions
  canEditRole?: boolean;
  canEditAccessLevel?: boolean;
  canEditDepartment?: boolean;
  canResetPassword?: boolean;
  canDeactivate?: boolean;
  
  // Callbacks
  onFieldChange?: (field: string, value: any, oldValue: any) => void;
  onTabChange?: (tab: string) => void;
  beforeSave?: (changes: Partial<User>) => Promise<Partial<User>>;
  afterSave?: (user: User) => void;
}

interface EditUserTab {
  id: string;
  label: string;
  icon?: IconType;
  badge?: string | number;
  fields?: string[];
  component?: React.ComponentType<TabProps>;
}
```

### 2.2 Component Implementation
```typescript
const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  onClose,
  user,
  tabs = defaultEditTabs,
  defaultTab = 'general',
  showActivityLog = true,
  allowInlineEdit = true,
  showChangeIndicators = true,
  ...props
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [editedUser, setEditedUser] = useState<User>(user);
  const [changes, setChanges] = useState<Partial<User>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Track changes
  useEffect(() => {
    const diff = getObjectDiff(user, editedUser);
    setChanges(diff);
  }, [user, editedUser]);
  
  // Field change handler
  const handleFieldChange = (field: string, value: any) => {
    const oldValue = editedUser[field];
    setEditedUser({ ...editedUser, [field]: value });
    props.onFieldChange?.(field, value, oldValue);
  };
  
  // Save changes
  const handleSave = async () => {
    if (props.requireConfirmation && Object.keys(changes).length > 0) {
      setShowConfirmation(true);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      let finalChanges = changes;
      if (props.beforeSave) {
        finalChanges = await props.beforeSave(changes);
      }
      
      const response = await updateUser(user.id, finalChanges);
      
      props.onSuccess?.(response.data);
      props.afterSave?.(response.data);
      toast.success('User updated successfully');
      onClose();
      
    } catch (error) {
      console.error('Error updating user:', error);
      props.onError?.(error as Error);
      toast.error('Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const hasChanges = Object.keys(changes).length > 0;
  
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={props.size || 'xl'}
        closeOnOverlayClick={!hasChanges}
        closeOnEsc={!hasChanges}
      >
        <ModalHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Edit User</h2>
            {showChangeIndicators && hasChanges && (
              <Badge variant="warning" size="sm">
                {Object.keys(changes).length} unsaved changes
              </Badge>
            )}
          </div>
        </ModalHeader>
        
        <ModalBody>
          <Tabs value={activeTab} onChange={setActiveTab}>
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  <div className="flex items-center gap-2">
                    {tab.icon && <tab.icon className="w-4 h-4" />}
                    {tab.label}
                    {tab.badge && (
                      <Badge size="xs" variant="neutral">
                        {tab.badge}
                      </Badge>
                    )}
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="general">
              <GeneralInfoTab
                user={editedUser}
                originalUser={user}
                onChange={handleFieldChange}
                editableFields={props.editableFields}
                lockedFields={props.lockedFields}
                showChangeIndicators={showChangeIndicators}
                allowInlineEdit={allowInlineEdit}
              />
            </TabsContent>
            
            <TabsContent value="access">
              <AccessControlTab
                user={editedUser}
                onChange={handleFieldChange}
                canEditRole={props.canEditRole}
                canEditAccessLevel={props.canEditAccessLevel}
              />
            </TabsContent>
            
            <TabsContent value="activity">
              <ActivityLogTab
                userId={user.id}
                showFilters
                showExport
              />
            </TabsContent>
            
            <TabsContent value="sessions">
              <SessionsTab
                userId={user.id}
                canTerminate={props.canDeactivate}
              />
            </TabsContent>
          </Tabs>
        </ModalBody>
        
        <ModalFooter>
          <div className="flex items-center justify-between w-full">
            <div>
              {props.compareWithOriginal && hasChanges && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChangesSummary(true)}
                  leftIcon={<FiGitBranch />}
                >
                  View Changes
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              {hasChanges && (
                <Button
                  variant="outline"
                  onClick={() => setEditedUser(user)}
                  disabled={isSubmitting}
                  leftIcon={<FiRotateCcw />}
                >
                  Reset
                </Button>
              )}
              
              <Button
                onClick={handleSave}
                loading={isSubmitting}
                disabled={!hasChanges}
                leftIcon={<FiSave />}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </ModalFooter>
      </Modal>
      
      {/* Confirmation Dialog */}
      {showConfirmation && (
        <ConfirmationModal
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={handleSave}
          title="Confirm Changes"
          message={props.confirmationMessage || 'Are you sure you want to save these changes?'}
          confirmText="Save Changes"
          confirmVariant="primary"
        />
      )}
    </>
  );
};
```

---

## 3. UserDetailsModal Component

### 3.1 Complete TypeScript Interface
```typescript
interface UserDetailsModalProps {
  // Modal state
  isOpen: boolean;
  onClose: () => void;
  
  // User data
  userId: string;
  user?: User; // Pre-loaded user data
  
  // Display options
  sections?: DetailSection[];
  defaultSection?: string;
  showHeader?: boolean;
  showActions?: boolean;
  
  // Features
  enableQuickEdit?: boolean;
  showActivityTimeline?: boolean;
  showPermissionMatrix?: boolean;
  showLoginHistory?: boolean;
  showAuditLog?: boolean;
  
  // Actions
  actions?: UserAction[];
  onAction?: (action: string, user: User) => void;
  
  // UI options
  size?: 'md' | 'lg' | 'xl' | 'full';
  layout?: 'tabs' | 'sections' | 'sidebar';
  theme?: 'light' | 'dark';
  
  // Callbacks
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onStatusChange?: (user: User, status: UserStatus) => void;
}

interface DetailSection {
  id: string;
  title: string;
  icon?: IconType;
  component: React.ComponentType<SectionProps>;
  visible?: boolean;
  order?: number;
}
```

### 3.2 Component Implementation
```typescript
const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onClose,
  userId,
  user: preloadedUser,
  sections = defaultDetailSections,
  defaultSection = 'overview',
  showHeader = true,
  showActions = true,
  enableQuickEdit = false,
  layout = 'tabs',
  ...props
}) => {
  const { data: user, loading, error } = useUser(userId, {
    initialData: preloadedUser,
    include: ['department', 'manager', 'permissions', 'activity']
  });
  
  const [activeSection, setActiveSection] = useState(defaultSection);
  const [isEditing, setIsEditing] = useState(false);
  
  if (!user && !loading) return null;
  
  const handleAction = (action: string) => {
    switch (action) {
      case 'edit':
        if (enableQuickEdit) {
          setIsEditing(true);
        } else {
          props.onEdit?.(user!);
        }
        break;
      case 'delete':
        props.onDelete?.(user!);
        break;
      case 'suspend':
        props.onStatusChange?.(user!, 'suspended');
        break;
      default:
        props.onAction?.(action, user!);
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={props.size || 'xl'}
      className="user-details-modal"
    >
      {loading ? (
        <UserDetailsSkeleton />
      ) : error ? (
        <ErrorState message="Failed to load user details" />
      ) : (
        <>
          {showHeader && (
            <ModalHeader>
              <UserHeader
                user={user!}
                showActions={showActions}
                actions={props.actions}
                onAction={handleAction}
              />
            </ModalHeader>
          )}
          
          <ModalBody className="p-0">
            {layout === 'tabs' ? (
              <TabsLayout
                sections={sections}
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                user={user!}
                {...props}
              />
            ) : layout === 'sidebar' ? (
              <SidebarLayout
                sections={sections}
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                user={user!}
                {...props}
              />
            ) : (
              <SectionsLayout
                sections={sections}
                user={user!}
                {...props}
              />
            )}
          </ModalBody>
        </>
      )}
    </Modal>
  );
};
```

### 3.3 Section Components

#### Overview Section
```typescript
const OverviewSection: React.FC<SectionProps> = ({ user }) => {
  return (
    <div className="p-6 space-y-6">
      {/* User Summary Card */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">User Information</h3>
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Full Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.fullName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <a href={`mailto:${user.email}`} className="text-primary-600 hover:underline">
                  {user.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Position</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.position}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Department</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.department?.name || 'Not assigned'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Manager</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.manager?.fullName || 'No manager'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Employment Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(user.employmentDate)}
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>
      
      {/* Access Summary */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Access & Permissions</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Role</span>
              <RoleBadge role={user.role} size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Access Level</span>
              <AccessLevelIndicator level={user.accessLevel} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <StatusBadge status={user.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Login</span>
              <span className="text-sm text-gray-600">
                {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Never'}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Logins"
          value={user.loginCount}
          icon={<FiLogIn />}
        />
        <StatCard
          label="Active Sessions"
          value={user.activeSessions?.length || 0}
          icon={<FiMonitor />}
        />
        <StatCard
          label="Permissions"
          value={user.permissions?.length || 0}
          icon={<FiShield />}
        />
        <StatCard
          label="Days Active"
          value={getDaysSince(user.createdAt)}
          icon={<FiCalendar />}
        />
      </div>
    </div>
  );
};
```

---

## 4. DeleteConfirmationModal Component

### 4.1 Complete TypeScript Interface
```typescript
interface DeleteConfirmationModalProps {
  // Modal state
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  
  // Content
  title?: string;
  message?: string | React.ReactNode;
  itemName?: string;
  itemType?: string;
  
  // Options
  requireConfirmation?: boolean;
  confirmationText?: string;
  showConsequences?: boolean;
  consequences?: string[];
  
  // UI
  variant?: 'danger' | 'warning';
  confirmButtonText?: string;
  cancelButtonText?: string;
  loading?: boolean;
  
  // Advanced
  onBeforeConfirm?: () => boolean | Promise<boolean>;
  customValidation?: (input: string) => boolean;
}
```

### 4.2 Component Implementation
```typescript
const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message,
  itemName,
  itemType = 'item',
  requireConfirmation = false,
  confirmationText,
  showConsequences = true,
  consequences = defaultConsequences,
  variant = 'danger',
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
  loading = false,
  ...props
}) => {
  const [confirmInput, setConfirmInput] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  
  const expectedText = confirmationText || itemName || 'DELETE';
  const isConfirmationValid = !requireConfirmation || 
    confirmInput.toLowerCase() === expectedText.toLowerCase();
  
  const handleConfirm = async () => {
    if (props.onBeforeConfirm) {
      const shouldContinue = await props.onBeforeConfirm();
      if (!shouldContinue) return;
    }
    
    if (props.customValidation && !props.customValidation(confirmInput)) {
      toast.error('Invalid confirmation');
      return;
    }
    
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Confirmation error:', error);
      toast.error('Action failed');
    } finally {
      setIsConfirming(false);
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      closeOnOverlayClick={false}
    >
      <ModalHeader>
        <div className="flex items-center gap-3">
          <div className={`
            p-2 rounded-full
            ${variant === 'danger' ? 'bg-red-100' : 'bg-yellow-100'}
          `}>
            <FiAlertTriangle className={`
              w-5 h-5
              ${variant === 'danger' ? 'text-red-600' : 'text-yellow-600'}
            `} />
          </div>
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
      </ModalHeader>
      
      <ModalBody>
        <div className="space-y-4">
          {message ? (
            <div className="text-gray-600">
              {typeof message === 'string' ? <p>{message}</p> : message}
            </div>
          ) : (
            <p className="text-gray-600">
              Are you sure you want to delete {itemName ? (
                <span className="font-semibold">"{itemName}"</span>
              ) : (
                `this ${itemType}`
              )}? This action cannot be undone.
            </p>
          )}
          
          {showConsequences && consequences.length > 0 && (
            <Alert variant="warning">
              <AlertTitle>This will also:</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {consequences.map((consequence, index) => (
                    <li key={index}>{consequence}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {requireConfirmation && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Type <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                  {expectedText}
                </span> to confirm
              </label>
              <Input
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={`Type ${expectedText} to confirm`}
                autoComplete="off"
                data-lpignore="true"
              />
            </div>
          )}
        </div>
      </ModalBody>
      
      <ModalFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isConfirming || loading}
        >
          {cancelButtonText}
        </Button>
        
        <Button
          variant={variant}
          onClick={handleConfirm}
          disabled={!isConfirmationValid || isConfirming || loading}
          loading={isConfirming || loading}
        >
          {confirmButtonText}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
```

---

## 5. BulkActionModal Component

### 5.1 Complete TypeScript Interface
```typescript
interface BulkActionModalProps {
  // Modal state
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (results: BulkActionResult[]) => void;
  onError?: (error: Error) => void;
  
  // Selection
  selectedUsers: User[];
  action: BulkActionType;
  
  // Configuration
  fields?: BulkActionField[];
  validation?: BulkActionValidation;
  preview?: boolean;
  
  // Options
  processInBatches?: boolean;
  batchSize?: number;
  showProgress?: boolean;
  allowPartialSuccess?: boolean;
  
  // UI
  size?: 'md' | 'lg' | 'xl';
  confirmationRequired?: boolean;
  
  // Callbacks
  onBeforeExecute?: (data: any) => Promise<any>;
  onItemProcess?: (user: User, index: number) => void;
  onItemComplete?: (user: User, result: any) => void;
}

type BulkActionType = 
  | 'update_status'
  | 'update_role'
  | 'update_department'
  | 'reset_passwords'
  | 'export'
  | 'delete';

interface BulkActionResult {
  userId: string;
  success: boolean;
  error?: string;
  changes?: any;
}
```

### 5.2 Component Implementation
```typescript
const BulkActionModal: React.FC<BulkActionModalProps> = ({
  isOpen,
  onClose,
  selectedUsers,
  action,
  fields = [],
  preview = true,
  processInBatches = true,
  batchSize = 10,
  showProgress = true,
  allowPartialSuccess = true,
  ...props
}) => {
  const [formData, setFormData] = useState<any>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BulkActionResult[]>([]);
  const [showPreview, setShowPreview] = useState(preview);
  
  const actionConfig = bulkActionConfigs[action];
  
  const handleExecute = async () => {
    try {
      setIsProcessing(true);
      setProgress(0);
      setResults([]);
      
      let processedData = formData;
      if (props.onBeforeExecute) {
        processedData = await props.onBeforeExecute(formData);
      }
      
      const results: BulkActionResult[] = [];
      
      if (processInBatches) {
        // Process in batches
        for (let i = 0; i < selectedUsers.length; i += batchSize) {
          const batch = selectedUsers.slice(i, i + batchSize);
          const batchResults = await processBatch(batch, processedData);
          results.push(...batchResults);
          
          setProgress(((i + batch.length) / selectedUsers.length) * 100);
          setResults([...results]);
        }
      } else {
        // Process all at once
        const allResults = await processAllUsers(selectedUsers, processedData);
        results.push(...allResults);
        setProgress(100);
        setResults(results);
      }
      
      // Check results
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      if (failureCount === 0) {
        toast.success(`Successfully ${actionConfig.pastTense} ${successCount} users`);
        props.onSuccess?.(results);
        onClose();
      } else if (allowPartialSuccess && successCount > 0) {
        toast.warning(`${actionConfig.pastTense} ${successCount} users, ${failureCount} failed`);
        props.onSuccess?.(results);
      } else {
        throw new Error(`Failed to ${actionConfig.verb} users`);
      }
      
    } catch (error) {
      console.error('Bulk action error:', error);
      props.onError?.(error as Error);
      toast.error(`Failed to ${actionConfig.verb} users`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const processBatch = async (
    users: User[], 
    data: any
  ): Promise<BulkActionResult[]> => {
    const promises = users.map(async (user, index) => {
      try {
        props.onItemProcess?.(user, index);
        
        const result = await executeBulkAction(action, user.id, data);
        
        props.onItemComplete?.(user, result);
        
        return {
          userId: user.id,
          success: true,
          changes: result
        };
      } catch (error) {
        return {
          userId: user.id,
          success: false,
          error: error.message
        };
      }
    });
    
    return Promise.all(promises);
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={props.size || 'lg'}
      closeOnOverlayClick={false}
    >
      <ModalHeader>
        <h2 className="text-xl font-semibold">
          {actionConfig.title} ({selectedUsers.length} users)
        </h2>
      </ModalHeader>
      
      <ModalBody>
        {showPreview && !isProcessing ? (
          <BulkActionPreview
            action={action}
            users={selectedUsers}
            formData={formData}
            onEdit={() => setShowPreview(false)}
          />
        ) : !isProcessing ? (
          <BulkActionForm
            action={action}
            fields={fields}
            formData={formData}
            onChange={setFormData}
            validation={props.validation}
          />
        ) : (
          <BulkActionProgress
            action={action}
            progress={progress}
            results={results}
            total={selectedUsers.length}
          />
        )}
      </ModalBody>
      
      <ModalFooter>
        {!isProcessing && (
          <>
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            
            {showPreview && (
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
                leftIcon={<FiEdit3 />}
              >
                Edit
              </Button>
            )}
            
            <Button
              variant={actionConfig.variant}
              onClick={handleExecute}
              disabled={!isFormValid(formData, props.validation)}
              leftIcon={actionConfig.icon}
            >
              {actionConfig.confirmText}
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
};
```

---

## 6. ImportUsersModal Component

### 6.1 Complete TypeScript Interface
```typescript
interface ImportUsersModalProps {
  // Modal state
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (imported: ImportResult) => void;
  onError?: (error: Error) => void;
  
  // Configuration
  allowedFormats?: FileFormat[];
  maxFileSize?: number; // in bytes
  maxRecords?: number;
  
  // Mapping
  autoDetectColumns?: boolean;
  requiredColumns?: string[];
  columnMappings?: ColumnMapping[];
  
  // Validation
  validateOnUpload?: boolean;
  validationRules?: ImportValidationRules;
  skipInvalidRows?: boolean;
  
  // Options
  duplicateHandling?: 'skip' | 'update' | 'error';
  sendWelcomeEmails?: boolean;
  generatePasswords?: boolean;
  
  // UI
  showPreview?: boolean;
  previewLimit?: number;
  showValidationSummary?: boolean;
  
  // Callbacks
  onFileSelect?: (file: File) => void;
  onMappingComplete?: (mappings: ColumnMapping[]) => void;
  onRowValidate?: (row: any, index: number) => ValidationResult;
}

interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: ImportError[];
  users: User[];
}
```

### 6.2 Component Implementation
```typescript
const ImportUsersModal: React.FC<ImportUsersModalProps> = ({
  isOpen,
  onClose,
  allowedFormats = ['csv', 'xlsx'],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  maxRecords = 1000,
  autoDetectColumns = true,
  requiredColumns = ['email', 'firstName', 'lastName', 'role'],
  duplicateHandling = 'skip',
  showPreview = true,
  previewLimit = 10,
  ...props
}) => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResults>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  
  // File upload handler
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file
    if (!isValidFileFormat(file, allowedFormats)) {
      toast.error(`Invalid file format. Allowed: ${allowedFormats.join(', ')}`);
      return;
    }
    
    if (file.size > maxFileSize) {
      toast.error(`File too large. Maximum size: ${formatFileSize(maxFileSize)}`);
      return;
    }
    
    setFile(file);
    props.onFileSelect?.(file);
    
    // Parse file
    try {
      setIsProcessing(true);
      const data = await parseFile(file);
      
      if (data.length > maxRecords) {
        toast.error(`Too many records. Maximum: ${maxRecords}`);
        return;
      }
      
      setParsedData(data);
      
      // Auto-detect columns
      if (autoDetectColumns) {
        const detectedMappings = detectColumnMappings(
          Object.keys(data[0] || {}),
          requiredColumns
        );
        setColumnMappings(detectedMappings);
      }
      
      setStep('mapping');
    } catch (error) {
      console.error('File parse error:', error);
      toast.error('Failed to parse file');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Validate data
  const handleValidation = async () => {
    setIsProcessing(true);
    
    try {
      const results = await validateImportData(
        parsedData,
        columnMappings,
        props.validationRules
      );
      
      setValidationResults(results);
      
      if (results.hasErrors && !props.skipInvalidRows) {
        toast.error(`${results.errorCount} validation errors found`);
      } else {
        setStep('review');
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate data');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Import users
  const handleImport = async () => {
    setIsProcessing(true);
    setImportProgress(0);
    
    try {
      const importData = prepareImportData(
        parsedData,
        columnMappings,
        validationResults
      );
      
      const result = await importUsers({
        data: importData,
        options: {
          duplicateHandling,
          sendWelcomeEmails: props.sendWelcomeEmails,
          generatePasswords: props.generatePasswords
        },
        onProgress: (progress) => setImportProgress(progress)
      });
      
      props.onSuccess?.(result);
      toast.success(`Successfully imported ${result.imported} users`);
      onClose();
      
    } catch (error) {
      console.error('Import error:', error);
      props.onError?.(error as Error);
      toast.error('Failed to import users');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      closeOnOverlayClick={false}
    >
      <ModalHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Import Users</h2>
          <ImportSteps currentStep={step} />
        </div>
      </ModalHeader>
      
      <ModalBody>
        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <FileUploadStep
              onFileUpload={handleFileUpload}
              allowedFormats={allowedFormats}
              maxFileSize={maxFileSize}
              isProcessing={isProcessing}
            />
          )}
          
          {step === 'mapping' && (
            <ColumnMappingStep
              sourceColumns={Object.keys(parsedData[0] || {})}
              targetColumns={requiredColumns}
              mappings={columnMappings}
              onMappingChange={setColumnMappings}
              sampleData={parsedData.slice(0, 5)}
            />
          )}
          
          {step === 'review' && (
            <ReviewStep
              data={parsedData}
              mappings={columnMappings}
              validationResults={validationResults}
              previewLimit={previewLimit}
              duplicateHandling={duplicateHandling}
              onDuplicateHandlingChange={setDuplicateHandling}
            />
          )}
          
          {step === 'importing' && (
            <ImportingStep
              progress={importProgress}
              total={parsedData.length}
            />
          )}
        </AnimatePresence>
      </ModalBody>
      
      <ModalFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        
        {step === 'mapping' && (
          <Button
            onClick={handleValidation}
            disabled={!isValidMapping(columnMappings, requiredColumns)}
            loading={isProcessing}
            rightIcon={<FiChevronRight />}
          >
            Validate
          </Button>
        )}
        
        {step === 'review' && (
          <>
            <Button
              variant="outline"
              onClick={() => setStep('mapping')}
              disabled={isProcessing}
              leftIcon={<FiChevronLeft />}
            >
              Back
            </Button>
            
            <Button
              onClick={handleImport}
              loading={isProcessing}
              leftIcon={<FiUpload />}
            >
              Import {validationResults?.validCount || 0} Users
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
};
```

---

## 7. ExportOptionsModal Component

### 7.1 Complete TypeScript Interface
```typescript
interface ExportOptionsModalProps {
  // Modal state
  isOpen: boolean;
  onClose: () => void;
  onExport?: (options: ExportOptions) => void;
  
  // Data
  totalRecords: number;
  selectedRecords?: string[];
  filters?: Record<string, any>;
  
  // Configuration
  formats?: ExportFormat[];
  defaultFormat?: ExportFormat;
  fields?: ExportField[];
  defaultFields?: string[];
  
  // Options
  allowCustomFields?: boolean;
  includeMetadata?: boolean;
  compressOutput?: boolean;
  
  // Limits
  maxRecords?: number;
  maxFileSize?: number;
  
  // UI
  showPreview?: boolean;
  estimateSize?: boolean;
}

interface ExportOptions {
  format: ExportFormat;
  fields: string[];
  filters: Record<string, any>;
  includeHeaders: boolean;
  dateFormat: string;
  timezone: string;
  compression: boolean;
}
```

### 7.2 Component Implementation
```typescript
const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({
  isOpen,
  onClose,
  onExport,
  totalRecords,
  selectedRecords,
  formats = ['csv', 'xlsx', 'json'],
  defaultFormat = 'csv',
  fields = defaultExportFields,
  defaultFields = fields.filter(f => f.default).map(f => f.key),
  ...props
}) => {
  const [format, setFormat] = useState<ExportFormat>(defaultFormat);
  const [selectedFields, setSelectedFields] = useState<string[]>(defaultFields);
  const [exportScope, setExportScope] = useState<'all' | 'selected' | 'filtered'>(
    selectedRecords && selectedRecords.length > 0 ? 'selected' : 'all'
  );
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');
  const [isExporting, setIsExporting] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState<number>();
  
  // Calculate record count
  const getRecordCount = () => {
    switch (exportScope) {
      case 'selected':
        return selectedRecords?.length || 0;
      case 'filtered':
        return props.filters ? getFilteredCount(props.filters) : totalRecords;
      default:
        return totalRecords;
    }
  };
  
  // Estimate file size
  useEffect(() => {
    if (props.estimateSize) {
      const size = estimateExportSize(
        getRecordCount(),
        selectedFields.length,
        format
      );
      setEstimatedSize(size);
    }
  }, [selectedFields, format, exportScope]);
  
  const handleExport = async () => {
    const recordCount = getRecordCount();
    
    if (props.maxRecords && recordCount > props.maxRecords) {
      toast.error(`Cannot export more than ${props.maxRecords} records`);
      return;
    }
    
    if (props.maxFileSize && estimatedSize && estimatedSize > props.maxFileSize) {
      toast.error(`Estimated file size exceeds limit`);
      return;
    }
    
    setIsExporting(true);
    
    try {
      const options: ExportOptions = {
        format,
        fields: selectedFields,
        filters: exportScope === 'filtered' ? props.filters || {} : {},
        includeHeaders,
        dateFormat,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        compression: props.compressOutput || false
      };
      
      if (exportScope === 'selected' && selectedRecords) {
        options.filters.id = { $in: selectedRecords };
      }
      
      onExport?.(options);
      toast.success('Export started');
      onClose();
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to start export');
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
    >
      <ModalHeader>
        <h2 className="text-xl font-semibold">Export Users</h2>
      </ModalHeader>
      
      <ModalBody>
        <div className="space-y-6">
          {/* Export Scope */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Export Scope
            </label>
            <RadioGroup
              value={exportScope}
              onChange={setExportScope}
              options={[
                {
                  value: 'all',
                  label: `All Users (${totalRecords})`
                },
                {
                  value: 'selected',
                  label: `Selected Users (${selectedRecords?.length || 0})`,
                  disabled: !selectedRecords || selectedRecords.length === 0
                },
                {
                  value: 'filtered',
                  label: `Filtered Users (${getFilteredCount(props.filters)})`,
                  disabled: !props.filters || Object.keys(props.filters).length === 0
                }
              ]}
            />
          </div>
          
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {formats.map((fmt) => (
                <FormatCard
                  key={fmt}
                  format={fmt}
                  selected={format === fmt}
                  onClick={() => setFormat(fmt)}
                />
              ))}
            </div>
          </div>
          
          {/* Field Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Fields to Export
            </label>
            <FieldSelector
              fields={fields}
              selected={selectedFields}
              onChange={setSelectedFields}
              showSelectAll
              searchable
              groupByCategory
            />
          </div>
          
          {/* Options */}
          <div className="space-y-3">
            <Checkbox
              label="Include column headers"
              checked={includeHeaders}
              onChange={setIncludeHeaders}
              disabled={format === 'json'}
            />
            
            {props.compressOutput && (
              <Checkbox
                label="Compress output (ZIP)"
                checked={compression}
                onChange={setCompression}
              />
            )}
          </div>
          
          {/* Date Format */}
          {format !== 'json' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Date Format
              </label>
              <Select
                value={dateFormat}
                onChange={setDateFormat}
                options={[
                  { value: 'YYYY-MM-DD', label: '2024-01-31' },
                  { value: 'MM/DD/YYYY', label: '01/31/2024' },
                  { value: 'DD/MM/YYYY', label: '31/01/2024' },
                  { value: 'ISO', label: '2024-01-31T00:00:00Z' }
                ]}
              />
            </div>
          )}
          
          {/* Summary */}
          <Alert variant="info">
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  Exporting {getRecordCount()} records with {selectedFields.length} fields
                </span>
                {estimatedSize && (
                  <span className="text-sm text-gray-500">
                    ~{formatFileSize(estimatedSize)}
                  </span>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </ModalBody>
      
      <ModalFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isExporting}
        >
          Cancel
        </Button>
        
        <Button
          onClick={handleExport}
          loading={isExporting}
          disabled={selectedFields.length === 0}
          leftIcon={<FiDownload />}
        >
          Export
        </Button>
      </ModalFooter>
    </Modal>
  );
};
```

---

## 8. PermissionsModal Component

### 8.1 Complete TypeScript Interface
```typescript
interface PermissionsModalProps {
  // Modal state
  isOpen: boolean;
  onClose: () => void;
  onSave?: (permissions: Permission[]) => void;
  
  // User data
  userId: string;
  userRole: UserRole;
  currentPermissions: Permission[];
  
  // Configuration
  availablePermissions: Permission[];
  permissionGroups?: PermissionGroup[];
  inheritedPermissions?: Permission[];
  
  // Options
  allowCustomPermissions?: boolean;
  showInheritance?: boolean;
  showEffectivePermissions?: boolean;
  validatePermissions?: boolean;
  
  // UI
  layout?: 'grid' | 'tree' | 'list';
  searchable?: boolean;
  groupByCategory?: boolean;
  
  // Callbacks
  onPermissionToggle?: (permission: Permission, enabled: boolean) => void;
  onGroupToggle?: (group: PermissionGroup, enabled: boolean) => void;
}

interface Permission {
  id: string;
  name: string;
  description?: string;
  category: string;
  dependencies?: string[];
  conflicts?: string[];
  requiredRole?: UserRole;
  requiredAccessLevel?: number;
}
```

### 8.2 Component Implementation
```typescript
const PermissionsModal: React.FC<PermissionsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  userId,
  userRole,
  currentPermissions,
  availablePermissions,
  inheritedPermissions = [],
  showInheritance = true,
  showEffectivePermissions = true,
  layout = 'grid',
  searchable = true,
  groupByCategory = true,
  ...props
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(currentPermissions.map(p => p.id))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Group permissions by category
  const groupedPermissions = useMemo(() => {
    if (!groupByCategory) {
      return [{ category: 'All Permissions', permissions: availablePermissions }];
    }
    
    return groupPermissionsByCategory(availablePermissions);
  }, [availablePermissions, groupByCategory]);
  
  // Filter permissions
  const filteredPermissions = useMemo(() => {
    let filtered = availablePermissions;
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (showOnlySelected) {
      filtered = filtered.filter(p => selectedPermissions.has(p.id));
    }
    
    return filtered;
  }, [availablePermissions, searchQuery, showOnlySelected, selectedPermissions]);
  
  // Handle permission toggle
  const handlePermissionToggle = (permission: Permission, enabled: boolean) => {
    const newSelected = new Set(selectedPermissions);
    
    if (enabled) {
      newSelected.add(permission.id);
      
      // Add dependencies
      if (permission.dependencies) {
        permission.dependencies.forEach(dep => newSelected.add(dep));
      }
    } else {
      newSelected.delete(permission.id);
      
      // Remove dependent permissions
      availablePermissions.forEach(p => {
        if (p.dependencies?.includes(permission.id)) {
          newSelected.delete(p.id);
        }
      });
    }
    
    // Check for conflicts
    if (props.validatePermissions) {
      const errors = validatePermissionSet(
        Array.from(newSelected),
        availablePermissions
      );
      setValidationErrors(errors);
    }
    
    setSelectedPermissions(newSelected);
    props.onPermissionToggle?.(permission, enabled);
  };
  
  // Handle save
  const handleSave = () => {
    const selected = availablePermissions.filter(p => 
      selectedPermissions.has(p.id)
    );
    
    onSave?.(selected);
    toast.success('Permissions updated successfully');
    onClose();
  };
  
  // Check if permission is available for user
  const isPermissionAvailable = (permission: Permission) => {
    if (permission.requiredRole && !hasRole(userRole, permission.requiredRole)) {
      return false;
    }
    
    if (permission.requiredAccessLevel && 
        getUserAccessLevel(userRole) < permission.requiredAccessLevel) {
      return false;
    }
    
    return true;
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
    >
      <ModalHeader>
        <h2 className="text-xl font-semibold">Manage Permissions</h2>
      </ModalHeader>
      
      <ModalBody>
        <div className="space-y-4">
          {/* Search and filters */}
          <div className="flex gap-4">
            {searchable && (
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search permissions..."
                className="flex-1"
              />
            )}
            
            <Checkbox
              label="Show only selected"
              checked={showOnlySelected}
              onChange={setShowOnlySelected}
            />
          </div>
          
          {/* Effective permissions summary */}
          {showEffectivePermissions && (
            <EffectivePermissionsSummary
              selected={selectedPermissions.size}
              inherited={inheritedPermissions.length}
              total={selectedPermissions.size + inheritedPermissions.length}
            />
          )}
          
          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <Alert variant="error">
              <AlertTitle>Permission Conflicts</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Permissions display */}
          {layout === 'grid' ? (
            <PermissionGrid
              groups={groupedPermissions}
              selectedPermissions={selectedPermissions}
              inheritedPermissions={inheritedPermissions}
              onToggle={handlePermissionToggle}
              isAvailable={isPermissionAvailable}
              expandedGroups={expandedGroups}
              onGroupToggle={(group) => {
                const newExpanded = new Set(expandedGroups);
                if (newExpanded.has(group)) {
                  newExpanded.delete(group);
                } else {
                  newExpanded.add(group);
                }
                setExpandedGroups(newExpanded);
              }}
            />
          ) : layout === 'tree' ? (
            <PermissionTree
              permissions={filteredPermissions}
              selectedPermissions={selectedPermissions}
              inheritedPermissions={inheritedPermissions}
              onToggle={handlePermissionToggle}
              isAvailable={isPermissionAvailable}
            />
          ) : (
            <PermissionList
              permissions={filteredPermissions}
              selectedPermissions={selectedPermissions}
              inheritedPermissions={inheritedPermissions}
              onToggle={handlePermissionToggle}
              isAvailable={isPermissionAvailable}
            />
          )}
        </div>
      </ModalBody>
      
      <ModalFooter>
        <div className="flex items-center justify-between w-full">
          <div>
            <span className="text-sm text-gray-500">
              {selectedPermissions.size} permissions selected
            </span>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={validationErrors.length > 0}
            >
              Save Permissions
            </Button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
};
```

---

## 9. PasswordResetModal Component

### 9.1 Complete TypeScript Interface
```typescript
interface PasswordResetModalProps {
  // Modal state
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  
  // User data
  userId: string;
  userEmail: string;
  userName: string;
  
  // Options
  resetMethod?: 'email' | 'manual' | 'temporary';
  requireOldPassword?: boolean;
  enforcePasswordPolicy?: boolean;
  sendNotification?: boolean;
  
  // Password options
  generatePassword?: boolean;
  passwordLength?: number;
  passwordComplexity?: PasswordComplexity;
  
  // UI
  showPasswordStrength?: boolean;
  showPasswordSuggestions?: boolean;
  
  // Callbacks
  onPasswordGenerated?: (password: string) => void;
  onResetComplete?: (method: string) => void;
}

interface PasswordComplexity {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
}
```

### 9.2 Component Implementation
```typescript
const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  userName,
  resetMethod = 'email',
  enforcePasswordPolicy = true,
  sendNotification = true,
  generatePassword = false,
  passwordLength = 12,
  showPasswordStrength = true,
  showPasswordSuggestions = true,
  ...props
}) => {
  const [method, setMethod] = useState<'email' | 'manual' | 'temporary'>(resetMethod);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);
  
  const passwordStrength = usePasswordStrength(newPassword);
  
  // Generate password
  const handleGeneratePassword = () => {
    const password = generateSecurePassword({
      length: passwordLength,
      ...props.passwordComplexity
    });
    
    setGeneratedPassword(password);
    setNewPassword(password);
    setConfirmPassword(password);
    props.onPasswordGenerated?.(password);
  };
  
  // Copy to clipboard
  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Password copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy password');
    }
  };
  
  // Submit reset
  const handleSubmit = async () => {
    // Validation
    if (method === 'manual') {
      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      
      if (enforcePasswordPolicy && !validatePassword(newPassword)) {
        toast.error('Password does not meet requirements');
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      switch (method) {
        case 'email':
          await sendPasswordResetEmail(userId);
          toast.success(`Password reset email sent to ${userEmail}`);
          break;
          
        case 'manual':
          await resetPassword(userId, {
            oldPassword: props.requireOldPassword ? oldPassword : undefined,
            newPassword,
            requireChange: false
          });
          toast.success('Password reset successfully');
          break;
          
        case 'temporary':
          const tempPassword = await setTemporaryPassword(userId);
          setGeneratedPassword(tempPassword);
          toast.success('Temporary password generated');
          break;
      }
      
      if (sendNotification && method !== 'email') {
        await sendPasswordChangeNotification(userId);
      }
      
      props.onResetComplete?.(method);
      props.onSuccess?.();
      
      if (method !== 'temporary') {
        onClose();
      }
      
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
    >
      <ModalHeader>
        <h2 className="text-xl font-semibold">Reset Password</h2>
        <p className="text-sm text-gray-500 mt-1">
          for {userName} ({userEmail})
        </p>
      </ModalHeader>
      
      <ModalBody>
        <div className="space-y-6">
          {/* Reset Method */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Reset Method
            </label>
            <RadioGroup
              value={method}
              onChange={setMethod}
              options={[
                {
                  value: 'email',
                  label: 'Send reset link via email',
                  description: 'User will receive an email with a secure link'
                },
                {
                  value: 'manual',
                  label: 'Set new password manually',
                  description: 'Enter a new password for the user'
                },
                {
                  value: 'temporary',
                  label: 'Generate temporary password',
                  description: 'Create a one-time password that must be changed'
                }
              ]}
            />
          </div>
          
          {/* Manual password reset */}
          {method === 'manual' && (
            <>
              {props.requireOldPassword && (
                <PasswordField
                  label="Current Password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              )}
              
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  <PasswordField
                    label="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="flex-1"
                  />
                  
                  {generatePassword && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGeneratePassword}
                      leftIcon={<FiRefreshCw />}
                    >
                      Generate
                    </Button>
                  )}
                </div>
                
                {showPasswordStrength && newPassword && (
                  <PasswordStrengthMeter
                    password={newPassword}
                    strength={passwordStrength}
                  />
                )}
                
                <PasswordField
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  error={
                    confirmPassword && newPassword !== confirmPassword
                      ? 'Passwords do not match'
                      : undefined
                  }
                />
                
                {showPasswordSuggestions && (
                  <PasswordRequirements
                    password={newPassword}
                    requirements={passwordRequirements}
                  />
                )}
              </div>
            </>
          )}
          
          {/* Temporary password display */}
          {method === 'temporary' && generatedPassword && (
            <Alert variant="success">
              <AlertTitle>Temporary Password Generated</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded font-mono">
                      {generatedPassword}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyPassword}
                      leftIcon={copied ? <FiCheck /> : <FiCopy />}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    This password must be changed on first login.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Notification option */}
          <Checkbox
            label="Send notification email to user"
            checked={sendNotification}
            onChange={(checked) => setSendNotification(checked)}
            disabled={method === 'email'}
          />
        </div>
      </ModalBody>
      
      <ModalFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        
        <Button
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={
            method === 'manual' && 
            (!newPassword || !confirmPassword || newPassword !== confirmPassword)
          }
        >
          {method === 'email' ? 'Send Reset Email' : 'Reset Password'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
```

---

## 10. Modal Base Components

### 10.1 Modal Container
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  animate?: boolean;
  zIndex?: number;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className,
  overlayClassName,
  contentClassName,
  animate = true,
  zIndex = 50
}) => {
  useEffect(() => {
    if (isOpen && closeOnEsc) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, closeOnEsc, onClose]);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };
  
  return createPortal(
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center',
        `z-${zIndex}`,
        className
      )}
    >
      {/* Overlay */}
      <motion.div
        initial={animate ? { opacity: 0 } : undefined}
        animate={animate ? { opacity: 1 } : undefined}
        exit={animate ? { opacity: 0 } : undefined}
        className={cn(
          'absolute inset-0 bg-black/50',
          overlayClassName
        )}
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      
      {/* Content */}
      <motion.div
        initial={animate ? { opacity: 0, scale: 0.95 } : undefined}
        animate={animate ? { opacity: 1, scale: 1 } : undefined}
        exit={animate ? { opacity: 0, scale: 0.95 } : undefined}
        transition={{ duration: 0.2 }}
        className={cn(
          'relative bg-white rounded-lg shadow-xl',
          'max-h-[90vh] overflow-hidden flex flex-col',
          'w-full',
          sizeClasses[size],
          contentClassName
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </div>,
    document.body
  );
};
```

### 10.2 Modal Components
```typescript
// Modal Header
export const ModalHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <div className={cn('px-6 py-4 border-b border-gray-200', className)}>
    {children}
  </div>
);

// Modal Body
export const ModalBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <div className={cn('px-6 py-4 overflow-y-auto flex-1', className)}>
    {children}
  </div>
);

// Modal Footer
export const ModalFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <div className={cn('px-6 py-4 border-t border-gray-200 flex gap-3 justify-end', className)}>
    {children}
  </div>
);
```

---

## Usage Examples

### Basic User Creation
```tsx
function UserManagement() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  return (
    <>
      <Button onClick={() => setShowCreateModal(true)}>
        Create User
      </Button>
      
      <UserCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(user) => {
          console.log('User created:', user);
          refetchUsers();
        }}
      />
    </>
  );
}
```

### User Details with Quick Actions
```tsx
function UserRow({ user }: { user: User }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  
  return (
    <>
      <TableRow onClick={() => setShowDetails(true)}>
        {/* Row content */}
      </TableRow>
      
      <UserDetailsModal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        userId={user.id}
        onEdit={() => {
          setShowDetails(false);
          setShowEdit(true);
        }}
      />
      
      <UserEditModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        user={user}
      />
    </>
  );
}
```

### Bulk Actions
```tsx
function UserTable() {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkActionType | null>(null);
  
  return (
    <>
      <BulkActionsBar
        selectedCount={selectedUsers.length}
        onAction={(action) => setBulkAction(action)}
      />
      
      {bulkAction && (
        <BulkActionModal
          isOpen={true}
          onClose={() => setBulkAction(null)}
          selectedUsers={selectedUsers}
          action={bulkAction}
          onSuccess={() => {
            setSelectedUsers([]);
            refetchUsers();
          }}
        />
      )}
    </>
  );
}
```

---

## Styling Guidelines

### Modal Sizes
- **Small (sm)**: 448px - Confirmations, simple forms
- **Medium (md)**: 512px - Standard forms, details
- **Large (lg)**: 768px - Complex forms, data tables
- **Extra Large (xl)**: 1024px - Full user management
- **Full**: 100% - Import/export, bulk operations

### Z-Index Hierarchy
- Base Modal: 50
- Nested Modal: 60
- Confirmation Dialog: 70
- Toast/Notifications: 80
- Tooltips: 90

### Animation Timing
- Open/Close: 200ms ease-out
- Step transitions: 200ms ease-in-out
- Progress indicators: 300ms linear
- Loading states: 150ms ease-in

---

## Accessibility

All modal components follow WCAG 2.1 AA standards:

1. **Focus Management**
   - Focus trapped within modal
   - Focus returns to trigger on close
   - First focusable element receives focus

2. **Keyboard Navigation**
   - ESC to close (when enabled)
   - Tab/Shift+Tab for navigation
   - Enter to submit forms
   - Arrow keys for radio/select

3. **Screen Reader Support**
   - Proper ARIA labels and descriptions
   - Live regions for dynamic content
   - Role and state announcements

4. **Visual Indicators**
   - Focus rings on all interactive elements
   - Error states with icons and colors
   - Loading states with spinners

---

This completes the comprehensive modal components specification for the Users Management feature. Each modal is designed to handle specific user management tasks with extensive customization options and robust error handling.