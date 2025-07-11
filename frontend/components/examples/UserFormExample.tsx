import React, { useState } from 'react';
import {
  Form,
  FormField,
  FormInput,
  FormSelect,
  FormCheckbox,
  FormRadioGroup,
} from '@/components/ui/forms';
import { Button, ButtonGroup } from '@/components/ui/atoms';
import { SelectOption } from '@/components/ui/atoms/Select';

const departmentOptions: SelectOption[] = [
  { value: 'sales', label: 'Sales', description: 'Sales department' },
  { value: 'finance', label: 'Finance', description: 'Finance department' },
  { value: 'operations', label: 'Operations', description: 'Operations department' },
  { value: 'hr', label: 'Human Resources', description: 'HR department' },
];

const roleOptions = [
  { value: 'admin', label: 'Administrator', helper: 'Full system access' },
  { value: 'manager', label: 'Manager', helper: 'Department management' },
  { value: 'user', label: 'User', helper: 'Basic access' },
];

export const UserFormExample: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    role: 'user',
    notifications: true,
    terms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (field: string) => (value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBlur = (field: string) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field: string) => {
    let error = '';
    
    switch (field) {
      case 'firstName':
      case 'lastName':
        if (!formData[field]) {
          error = `${field === 'firstName' ? 'First' : 'Last'} name is required`;
        } else if (formData[field].length < 2) {
          error = `${field === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters`;
        }
        break;
      case 'email':
        if (!formData.email) {
          error = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          error = 'Invalid email format';
        }
        break;
      case 'department':
        if (!formData.department) {
          error = 'Please select a department';
        }
        break;
      case 'terms':
        if (!formData.terms) {
          error = 'You must accept the terms and conditions';
        }
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Touch all fields
    const allFields = ['firstName', 'lastName', 'email', 'department', 'terms'];
    const newTouched = allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {});
    setTouched(newTouched);
    
    // Validate all fields
    const isValid = allFields.every(field => validateField(field));
    
    if (isValid) {
      console.log('Form submitted:', formData);
      // Handle form submission
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Create New User</h2>
      
      <Form onSubmit={handleSubmit} spacing="normal">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="firstName"
            label="First Name"
            required
            error={errors.firstName}
            touched={touched.firstName}
          >
            <FormInput
              value={formData.firstName}
              onChange={(e) => handleChange('firstName')(e.target.value)}
              onBlur={handleBlur('firstName')}
              placeholder="Enter first name"
            />
          </FormField>
          
          <FormField
            name="lastName"
            label="Last Name"
            required
            error={errors.lastName}
            touched={touched.lastName}
          >
            <FormInput
              value={formData.lastName}
              onChange={(e) => handleChange('lastName')(e.target.value)}
              onBlur={handleBlur('lastName')}
              placeholder="Enter last name"
            />
          </FormField>
        </div>
        
        <FormField
          name="email"
          label="Email Address"
          required
          hint="This will be used for login"
          error={errors.email}
          touched={touched.email}
        >
          <FormInput
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email')(e.target.value)}
            onBlur={handleBlur('email')}
            placeholder="user@example.com"
          />
        </FormField>
        
        <FormField
          name="department"
          label="Department"
          required
          error={errors.department}
          touched={touched.department}
        >
          <FormSelect
            options={departmentOptions}
            value={formData.department}
            onChange={handleChange('department')}
            onBlur={handleBlur('department')}
            placeholder="Select a department"
            searchable
            clearable
          />
        </FormField>
        
        <FormField
          name="role"
          label="User Role"
          required
        >
          <FormRadioGroup
            name="role"
            value={formData.role}
            onChange={handleChange('role')}
            options={roleOptions}
          />
        </FormField>
        
        <FormField name="notifications">
          <FormCheckbox
            checked={formData.notifications}
            onChange={(e) => handleChange('notifications')(e.target.checked)}
            label="Send email notifications"
            helper="Receive updates about account activity"
          />
        </FormField>
        
        <FormField
          name="terms"
          error={errors.terms}
          touched={touched.terms}
        >
          <FormCheckbox
            checked={formData.terms}
            onChange={(e) => handleChange('terms')(e.target.checked)}
            label="I accept the terms and conditions"
          />
        </FormField>
        
        <ButtonGroup spacing="md" className="mt-6">
          <Button type="submit" variant="primary">
            Create User
          </Button>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </ButtonGroup>
      </Form>
    </div>
  );
};