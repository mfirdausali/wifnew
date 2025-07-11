# Users Management - Form Components Detailed Specification

## Overview
This document provides exhaustive specifications for all form-related components used in the Users Management feature. Each component includes complete TypeScript interfaces, implementation details, validation logic, and accessibility features.

## Table of Contents
1. [FormField Component](#formfield-component)
2. [FormGroup Component](#formgroup-component)
3. [FormSection Component](#formsection-component)
4. [MultiStepForm Component](#multistepform-component)
5. [PasswordField Component](#passwordfield-component)
6. [DepartmentPicker Component](#departmentpicker-component)
7. [RoleSelector Component](#roleselector-component)
8. [AccessLevelSlider Component](#accesslevelslider-component)
9. [ValidationMessage Component](#validationmessage-component)
10. [FormSkeleton Component](#formskeleton-component)

---

## 1. FormField Component

### 1.1 Purpose
Wrapper component that handles label, input, error, and hint rendering with consistent spacing and styling.

### 1.2 TypeScript Interface
```typescript
interface FormFieldProps {
  // Field identification
  name: string;
  id?: string;
  
  // Label configuration
  label?: string;
  labelPosition?: 'top' | 'left' | 'floating';
  required?: boolean;
  requiredIndicator?: '*' | 'required' | 'optional';
  
  // Field content
  children: React.ReactNode;
  
  // Help text
  hint?: string;
  hintIcon?: IconType;
  hintPosition?: 'below' | 'tooltip';
  
  // Validation
  error?: string | string[];
  warning?: string;
  success?: string;
  touched?: boolean;
  
  // Layout
  fullWidth?: boolean;
  inline?: boolean;
  spacing?: 'compact' | 'normal' | 'relaxed';
  
  // Styling
  className?: string;
  labelClassName?: string;
  contentClassName?: string;
  
  // Accessibility
  description?: string;
  
  // Advanced
  showCharacterCount?: boolean;
  maxLength?: number;
  currentLength?: number;
}
```

### 1.3 Implementation Details
- Auto-generates IDs if not provided
- Manages aria-describedby for errors and hints
- Handles required field indicators
- Supports floating labels for Material Design style
- Character count display for text inputs
- Touch state management for validation display

---

## 2. FormGroup Component

### 2.1 Purpose
Groups related form fields with optional title and description.

### 2.2 TypeScript Interface
```typescript
interface FormGroupProps {
  // Content
  title?: string;
  description?: string;
  children: React.ReactNode;
  
  // Layout
  columns?: 1 | 2 | 3 | 4 | 'auto';
  gap?: 'sm' | 'md' | 'lg';
  
  // Styling
  bordered?: boolean;
  shadowed?: boolean;
  className?: string;
  
  // Collapsible
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  
  // Validation
  showErrorSummary?: boolean;
  errors?: Record<string, string>;
}
```

---

## 3. FormSection Component

### 3.1 Purpose
Major section divider within forms with progress indication.

### 3.2 TypeScript Interface
```typescript
interface FormSectionProps {
  // Identification
  id: string;
  number?: number;
  
  // Content
  title: string;
  subtitle?: string;
  icon?: IconType;
  children: React.ReactNode;
  
  // State
  completed?: boolean;
  active?: boolean;
  disabled?: boolean;
  
  // Progress
  showProgress?: boolean;
  progressSteps?: number;
  currentStep?: number;
  
  // Actions
  onEdit?: () => void;
  collapsedContent?: React.ReactNode;
}
```

---

## 4. MultiStepForm Component

### 4.1 Purpose
Manages multi-step form flow with validation, navigation, and progress tracking.

### 4.2 Complete TypeScript Interface
```typescript
interface MultiStepFormProps<T = any> {
  // Steps configuration
  steps: FormStep<T>[];
  
  // Form state
  initialValues: T;
  validationSchema?: yup.Schema<T>;
  
  // Callbacks
  onSubmit: (values: T) => void | Promise<void>;
  onStepChange?: (step: number, values: T) => void;
  onCancel?: () => void;
  
  // Navigation
  showProgressBar?: boolean;
  showStepNumbers?: boolean;
  allowSkip?: boolean;
  allowJumpToStep?: boolean;
  
  // Validation
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnNavigate?: boolean;
  
  // Persistence
  persistKey?: string;
  clearOnComplete?: boolean;
  
  // Styling
  className?: string;
  progressBarPosition?: 'top' | 'left' | 'right';
}

interface FormStep<T> {
  id: string;
  title: string;
  subtitle?: string;
  icon?: IconType;
  
  // Content
  component: React.ComponentType<StepComponentProps<T>>;
  
  // Validation
  fields?: (keyof T)[];
  validationSchema?: yup.Schema<Partial<T>>;
  
  // Behavior
  optional?: boolean;
  skipCondition?: (values: T) => boolean;
  
  // Actions
  onEnter?: (values: T) => void;
  onExit?: (values: T) => void;
}

interface StepComponentProps<T> {
  values: T;
  errors: FormikErrors<T>;
  touched: FormikTouched<T>;
  handleChange: (e: React.ChangeEvent<any>) => void;
  handleBlur: (e: React.FocusEvent<any>) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldTouched: (field: keyof T, touched: boolean) => void;
}
```

### 4.3 Key Features
- Step validation before navigation
- Automatic progress persistence
- Keyboard navigation support
- Step skip conditions
- Async validation support
- Error recovery
- Analytics tracking

---

## 5. PasswordField Component

### 5.1 Purpose
Specialized input for password entry with strength meter and visibility toggle.

### 5.2 Complete Implementation Structure
```typescript
interface PasswordFieldProps extends InputProps {
  // Password specific
  showStrengthMeter?: boolean;
  strengthMeterPosition?: 'below' | 'inline' | 'popover';
  
  // Requirements
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  customRequirements?: PasswordRequirement[];
  
  // Password generation
  showGenerator?: boolean;
  generatorOptions?: {
    length?: number;
    includeSymbols?: boolean;
    excludeAmbiguous?: boolean;
    excludeSimilar?: boolean;
  };
  
  // Confirmation
  confirmPassword?: boolean;
  confirmPasswordLabel?: string;
  confirmPasswordError?: string;
  
  // Security
  preventPaste?: boolean;
  maskDelay?: number;
  
  // Callbacks
  onStrengthChange?: (strength: PasswordStrength) => void;
  onGenerate?: (password: string) => void;
}
```

### 5.3 Features
- Real-time strength calculation
- Configurable requirements
- Password generator with options
- Confirmation field matching
- Copy protection options
- Breach detection integration
- History checking

---

## 6. DepartmentPicker Component

### 6.1 Purpose
Hierarchical department selection with search and creation capabilities.

### 6.2 Structure
```typescript
interface DepartmentPickerProps {
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  
  // Mode
  multiple?: boolean;
  hierarchical?: boolean;
  
  // Data
  departments?: Department[];
  loadDepartments?: () => Promise<Department[]>;
  
  // Creation
  allowCreate?: boolean;
  onCreateDepartment?: (name: string, parentId?: string) => Promise<Department>;
  
  // Display
  showPath?: boolean;
  showCount?: boolean;
  showDescription?: boolean;
  
  // Search
  searchable?: boolean;
  searchPlaceholder?: string;
  minSearchLength?: number;
  
  // Validation
  required?: boolean;
  maxSelections?: number;
  disabledDepartments?: string[];
  
  // Styling
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'filled';
}

interface Department {
  id: string;
  name: string;
  parentId?: string;
  path?: string;
  description?: string;
  memberCount?: number;
  children?: Department[];
  metadata?: Record<string, any>;
}
```

### 6.3 Features
- Tree view with expand/collapse
- Breadcrumb path display
- Quick search with highlighting
- Lazy loading for large trees
- Drag-and-drop reorganization
- Recent selections
- Keyboard navigation

---

## 7. RoleSelector Component

### 7.1 Purpose
Visual role selection with permissions preview.

### 7.2 Complete Interface
```typescript
interface RoleSelectorProps {
  value?: string;
  onChange: (role: string) => void;
  
  // Roles configuration
  roles?: Role[];
  loadRoles?: () => Promise<Role[]>;
  
  // Display mode
  displayMode?: 'cards' | 'list' | 'dropdown';
  
  // Information display
  showPermissions?: boolean;
  showDescription?: boolean;
  showUserCount?: boolean;
  compareMode?: boolean;
  
  // Filtering
  filterByDepartment?: string;
  filterByAccessLevel?: number;
  excludeRoles?: string[];
  
  // Interactivity
  allowHover?: boolean;
  expandOnHover?: boolean;
  
  // Validation
  required?: boolean;
  error?: string;
  
  // Callbacks
  onRoleHover?: (role: Role) => void;
  onPermissionClick?: (permission: string) => void;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: IconType;
  color?: string;
  permissions: Permission[];
  userCount?: number;
  accessLevel: number;
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    department?: string;
  };
}
```

### 7.3 Display Modes

#### Cards Mode
- Visual cards with icons and colors
- Hover to preview permissions
- Click to select
- Comparison view side-by-side

#### List Mode
- Compact list with expandable details
- Inline permission badges
- Quick actions menu

#### Dropdown Mode
- Standard select with rich options
- Permission count badges
- Grouped by department

---

## 8. AccessLevelSlider Component

### 8.1 Purpose
Visual slider for selecting access levels 1-5 with descriptions.

### 8.2 Complete Implementation
```typescript
interface AccessLevelSliderProps {
  value: number;
  onChange: (level: number) => void;
  
  // Configuration
  min?: number;
  max?: number;
  step?: number;
  
  // Display
  showLabels?: boolean;
  showDescriptions?: boolean;
  showExamples?: boolean;
  
  // Levels configuration
  levels?: AccessLevelConfig[];
  
  // Validation
  disabled?: boolean;
  disabledLevels?: number[];
  
  // Visual
  color?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showTicks?: boolean;
  
  // Interaction
  showTooltip?: boolean;
  tooltipPosition?: 'top' | 'bottom';
  
  // Callbacks
  onHover?: (level: number) => void;
}

interface AccessLevelConfig {
  value: number;
  label: string;
  description: string;
  examples: string[];
  color: string;
  icon?: IconType;
  permissions?: string[];
}
```

### 8.3 Default Level Configurations
```typescript
const defaultLevels: AccessLevelConfig[] = [
  {
    value: 1,
    label: "Basic",
    description: "View only access within department",
    examples: ["View team members", "Read reports"],
    color: "gray",
    icon: EyeIcon
  },
  {
    value: 2,
    label: "Standard",
    description: "Create and edit own records",
    examples: ["Create entries", "Edit own data"],
    color: "blue",
    icon: PencilIcon
  },
  {
    value: 3,
    label: "Enhanced",
    description: "Full department access",
    examples: ["Approve requests", "Manage team"],
    color: "green",
    icon: ShieldCheckIcon
  },
  {
    value: 4,
    label: "Manager",
    description: "Cross-department access",
    examples: ["Access all departments", "Generate reports"],
    color: "purple",
    icon: BriefcaseIcon
  },
  {
    value: 5,
    label: "Executive",
    description: "Full system access",
    examples: ["System configuration", "Access all data"],
    color: "red",
    icon: KeyIcon
  }
];
```

---

## 9. ValidationMessage Component

### 9.1 Purpose
Consistent display of validation messages with icons and animations.

### 9.2 Interface
```typescript
interface ValidationMessageProps {
  type: 'error' | 'warning' | 'success' | 'info';
  message: string | string[];
  
  // Display
  showIcon?: boolean;
  inline?: boolean;
  
  // Animation
  animate?: boolean;
  animationType?: 'fade' | 'slide' | 'pop';
  
  // Interaction
  dismissible?: boolean;
  onDismiss?: () => void;
  
  // Timing
  autoHide?: boolean;
  hideDelay?: number;
  
  // Actions
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

---

## 10. FormSkeleton Component

### 10.1 Purpose
Loading skeleton for forms during data fetching.

### 10.2 Configuration
```typescript
interface FormSkeletonProps {
  // Layout
  fields?: number;
  columns?: 1 | 2 | 3;
  
  // Field types
  fieldTypes?: ('text' | 'select' | 'textarea' | 'checkbox' | 'radio')[];
  
  // Sections
  sections?: number;
  showSectionTitles?: boolean;
  
  // Animation
  animation?: 'pulse' | 'wave' | 'none';
  speed?: 'slow' | 'normal' | 'fast';
  
  // Specific skeletons
  variant?: 'userForm' | 'settingsForm' | 'custom';
}
```

---

## Form Composition Examples

### Complete User Creation Form
```typescript
const UserCreationForm = () => {
  const steps: FormStep<CreateUserData>[] = [
    {
      id: 'personal',
      title: 'Personal Information',
      icon: UserIcon,
      component: PersonalInfoStep,
      fields: ['firstName', 'lastName', 'email', 'phone'],
      validationSchema: personalInfoSchema
    },
    {
      id: 'professional',
      title: 'Professional Details',
      icon: BriefcaseIcon,
      component: ProfessionalDetailsStep,
      fields: ['position', 'department', 'manager', 'startDate'],
      validationSchema: professionalSchema
    },
    {
      id: 'access',
      title: 'Access Configuration',
      icon: ShieldIcon,
      component: AccessConfigStep,
      fields: ['role', 'accessLevel', 'permissions'],
      validationSchema: accessSchema
    },
    {
      id: 'password',
      title: 'Set Password',
      icon: KeyIcon,
      component: PasswordSetupStep,
      fields: ['password', 'confirmPassword', 'requireChange'],
      validationSchema: passwordSchema
    }
  ];

  return (
    <MultiStepForm
      steps={steps}
      initialValues={initialUserData}
      validationSchema={createUserSchema}
      onSubmit={handleCreateUser}
      showProgressBar
      persistKey="create-user-form"
      validateOnNavigate
    />
  );
};

// Step component example
const PersonalInfoStep: React.FC<StepComponentProps<CreateUserData>> = ({
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  setFieldValue
}) => {
  return (
    <FormSection title="Personal Information" subtitle="Basic user details">
      <FormGroup columns={2}>
        <FormField
          name="firstName"
          label="First Name"
          required
          error={touched.firstName && errors.firstName}
        >
          <Input
            name="firstName"
            value={values.firstName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter first name"
          />
        </FormField>

        <FormField
          name="lastName"
          label="Last Name"
          required
          error={touched.lastName && errors.lastName}
        >
          <Input
            name="lastName"
            value={values.lastName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter last name"
          />
        </FormField>

        <FormField
          name="email"
          label="Email Address"
          required
          hint="This will be used for login"
          error={touched.email && errors.email}
        >
          <Input
            type="email"
            name="email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="user@example.com"
            icon={MailIcon}
          />
        </FormField>

        <FormField
          name="phone"
          label="Phone Number"
          hint="Include country code"
          error={touched.phone && errors.phone}
        >
          <Input
            type="tel"
            name="phone"
            value={values.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="+1 (555) 123-4567"
            mask="+1 (999) 999-9999"
          />
        </FormField>
      </FormGroup>

      <FormField
        name="profilePhoto"
        label="Profile Photo"
        hint="Upload a professional photo"
      >
        <AvatarUpload
          value={values.profilePhoto}
          onChange={(file) => setFieldValue('profilePhoto', file)}
          maxSize={5 * 1024 * 1024} // 5MB
        />
      </FormField>
    </FormSection>
  );
};
```

## Validation Schemas

```typescript
// Personal info validation
const personalInfoSchema = yup.object({
  firstName: yup
    .string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s-']+$/, 'First name contains invalid characters'),
  
  lastName: yup
    .string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s-']+$/, 'Last name contains invalid characters'),
  
  email: yup
    .string()
    .required('Email is required')
    .email('Invalid email format')
    .test('email-domain', 'Email domain not allowed', async (value) => {
      if (!value) return true;
      const domain = value.split('@')[1];
      const allowedDomains = await fetchAllowedDomains();
      return allowedDomains.includes(domain);
    }),
  
  phone: yup
    .string()
    .matches(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .nullable()
});

// Professional details validation
const professionalSchema = yup.object({
  position: yup
    .string()
    .required('Position is required')
    .min(3, 'Position must be at least 3 characters'),
  
  department: yup
    .string()
    .required('Department is required'),
  
  manager: yup
    .string()
    .nullable()
    .when('role', {
      is: (role: string) => role !== 'admin',
      then: yup.string().required('Manager is required for non-admin users')
    }),
  
  startDate: yup
    .date()
    .required('Start date is required')
    .max(new Date(), 'Start date cannot be in the future')
});

// Access configuration validation
const accessSchema = yup.object({
  role: yup
    .string()
    .required('Role is required')
    .oneOf(['admin', 'sales_manager', 'finance_manager', 'operations_manager']),
  
  accessLevel: yup
    .number()
    .required('Access level is required')
    .min(1, 'Access level must be at least 1')
    .max(5, 'Access level cannot exceed 5'),
  
  permissions: yup
    .array()
    .of(yup.string())
    .min(1, 'At least one permission must be selected')
});

// Password validation
const passwordSchema = yup.object({
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number and special character'
    ),
  
  confirmPassword: yup
    .string()
    .required('Password confirmation is required')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  
  requireChange: yup
    .boolean()
    .default(true)
});
```

## Form State Management

```typescript
// Custom hook for form state
export const useUserForm = () => {
  const [formState, setFormState] = useState<FormState>({
    currentStep: 0,
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValidating: false
  });

  const validateStep = useCallback(async (step: number) => {
    setFormState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const stepSchema = steps[step].validationSchema;
      if (stepSchema) {
        await stepSchema.validate(formState.values, { abortEarly: false });
      }
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors = error.inner.reduce((acc, err) => ({
          ...acc,
          [err.path!]: err.message
        }), {});
        setFormState(prev => ({ ...prev, errors }));
      }
      return false;
    } finally {
      setFormState(prev => ({ ...prev, isValidating: false }));
    }
  }, [formState.values, steps]);

  const nextStep = useCallback(async () => {
    const isValid = await validateStep(formState.currentStep);
    if (isValid && formState.currentStep < steps.length - 1) {
      setFormState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        errors: {}
      }));
    }
  }, [formState.currentStep, validateStep]);

  const previousStep = useCallback(() => {
    if (formState.currentStep > 0) {
      setFormState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1
      }));
    }
  }, [formState.currentStep]);

  const submitForm = useCallback(async () => {
    setFormState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      // Validate all steps
      for (let i = 0; i <= formState.currentStep; i++) {
        const isValid = await validateStep(i);
        if (!isValid) {
          setFormState(prev => ({ 
            ...prev, 
            currentStep: i,
            isSubmitting: false 
          }));
          return;
        }
      }
      
      // Submit form
      await onSubmit(formState.values);
      
      // Clear form state
      setFormState({
        currentStep: 0,
        values: initialValues,
        errors: {},
        touched: {},
        isSubmitting: false,
        isValidating: false
      });
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [formState, validateStep, onSubmit]);

  return {
    formState,
    setFieldValue,
    setFieldTouched,
    nextStep,
    previousStep,
    submitForm,
    resetForm
  };
};
```

## Accessibility Features

1. **Keyboard Navigation**
   - Tab through all form fields
   - Enter to submit, Escape to cancel
   - Arrow keys for select/radio navigation
   - Page Up/Down for step navigation

2. **Screen Reader Support**
   - Proper ARIA labels and descriptions
   - Error announcements
   - Progress announcements
   - Form section landmarks

3. **Focus Management**
   - Focus first field on step change
   - Focus error field on validation
   - Trap focus in modals
   - Skip links for long forms

4. **Visual Indicators**
   - Required field markers
   - Error states with color and icons
   - Progress indication
   - Loading states

## Performance Optimizations

1. **Lazy Loading**
   - Step components loaded on demand
   - Heavy validation schemas split
   - Async field validation

2. **Memoization**
   - Form fields with React.memo
   - Validation results cached
   - Computed values memoized

3. **Debouncing**
   - Input validation debounced
   - API calls throttled
   - Search inputs optimized

4. **State Management**
   - Local state for field values
   - Global state for form data
   - Persistent state for drafts