export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  email?: boolean;
  phone?: boolean;
  idNumber?: boolean;
}

export interface ValidationErrors {
  [key: string]: string;
}

export const validateField = (value: any, rules: ValidationRule, fieldName: string): string | null => {
  // Required validation
  if (rules.required && (!value || value.toString().trim() === '')) {
    return `${fieldName} is required`;
  }

  // Skip other validations if value is empty and not required
  if (!value || value.toString().trim() === '') {
    return null;
  }

  // Min length validation
  if (rules.minLength && value.toString().length < rules.minLength) {
    return `${fieldName} must be at least ${rules.minLength} characters`;
  }

  // Max length validation
  if (rules.maxLength && value.toString().length > rules.maxLength) {
    return `${fieldName} must be no more than ${rules.maxLength} characters`;
  }

  // Email validation
  if (rules.email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      return 'Please enter a valid email address';
    }
  }

  // Phone validation (South African format)
  if (rules.phone) {
    const phonePattern = /^(\+27|0)[0-9]{9}$/;
    if (!phonePattern.test(value.replace(/\s/g, ''))) {
      return 'Please enter a valid South African phone number (e.g., 083 123 4567)';
    }
  }

  // ID Number validation (South African)
  if (rules.idNumber) {
    const idPattern = /^[0-9]{13}$/;
    if (!idPattern.test(value.replace(/\s/g, ''))) {
      return 'Please enter a valid South African ID number (13 digits)';
    }
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(value)) {
    return `${fieldName} format is invalid`;
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
};

export const validateForm = (data: any, validationRules: { [key: string]: ValidationRule }): ValidationErrors => {
  const errors: ValidationErrors = {};

  Object.keys(validationRules).forEach(field => {
    const value = data[field];
    const rules = validationRules[field];
    const error = validateField(value, rules, field);
    
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
};

// Common validation rules
export const commonRules = {
  email: {
    required: true,
    email: true,
  },
  password: {
    required: true,
    minLength: 6,
  },
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50,
  },
  phone: {
    required: true,
    phone: true,
  },
  idNumber: {
    required: true,
    idNumber: true,
  },
  studentNumber: {
    required: true,
    pattern: /^[0-9]{10}$/,
  },
  course: {
    required: true,
  },
  year: {
    required: true,
    custom: (value: number) => {
      if (value < 1 || value > 5) {
        return 'Year must be between 1 and 5';
      }
      return null;
    },
  },
};

// Form validation hooks
export const useFormValidation = (initialData: any, validationRules: { [key: string]: ValidationRule }) => {
  const [data, setData] = React.useState(initialData);
  const [errors, setErrors] = React.useState<ValidationErrors>({});
  const [touched, setTouched] = React.useState<{ [key: string]: boolean }>({});

  const validate = React.useCallback(() => {
    const newErrors = validateForm(data, validationRules);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data, validationRules]);

  const isFormValid = React.useMemo(() => {
    const currentErrors = validateForm(data, validationRules);
    return Object.keys(currentErrors).length === 0 && 
           Object.keys(validationRules).every(field => data[field] && data[field].toString().trim() !== '');
  }, [data, validationRules]);

  const handleChange = React.useCallback((field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleBlur = React.useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate field on blur
    const fieldRules = validationRules[field];
    if (fieldRules) {
      const error = validateField(data[field], fieldRules, field);
      setErrors(prev => ({ ...prev, [field]: error || '' }));
    }
  }, [data, validationRules]);

  const handleSubmit = React.useCallback((onSubmit: (data: any) => void) => {
    const isValid = validate();
    if (isValid) {
      onSubmit(data);
    } else {
      // Mark all fields as touched to show errors
      const allTouched = Object.keys(validationRules).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as { [key: string]: boolean });
      setTouched(allTouched);
    }
    return isValid;
  }, [validate, validationRules, data]);

  const reset = React.useCallback(() => {
    setData(initialData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  return {
    data,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    validate,
    reset,
    isValid: isFormValid,
  };
};

// Import React for the hook
import React from 'react';
