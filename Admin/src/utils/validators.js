// Global validation utilities for form fields
export const validators = {
  // Email validation - matches backend regex
  email: (value, isRequired = true) => {
    if (isRequired && (!value || value.trim() === '')) return "Email is required";
    if (value && value.trim() !== '') {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(value.trim())) return "Please enter a valid email address";
    }
    return null;
  },

  // Phone validation - matches backend regex
  phone: (value, isRequired = false) => {
    if (isRequired && (!value || value.trim() === '')) return "Phone is required";
    if (value && value.trim() !== '') {
      const phoneRegex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(value.trim())) return "Please enter a valid phone number";
    }
    return null;
  },

  // Password validation - matches backend requirements
  password: (value, isRequired = true) => {
    if (isRequired && (!value || value.trim() === '')) return "Password is required";
    if (value && value.trim() !== '') {
      if (value.length < 8) return "Password must be at least 8 characters";
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
      if (!passwordRegex.test(value)) {
        return "Password must include uppercase, lowercase, number, and special character";
      }
    }
    return null;
  },

  // Postal code validation - basic validation for common formats
  postalCode: (value, isRequired = false) => {
    if (isRequired && (!value || value.trim() === '')) return "Postal code is required";
    if (value && value.trim() !== '') {
      // Basic validation for common postal code formats
      const postalRegex = /^[A-Za-z0-9\s\-]{3,10}$/;
      if (!postalRegex.test(value.trim())) return "Please enter a valid postal code";
    }
    return null;
  },

  // First name validation
  firstName: (value, isRequired = true) => {
    if (isRequired && (!value || value.trim() === '')) return "First name is required";
    if (value && value.trim() !== '') {
      if (value.trim().length < 2) return "First name must be at least 2 characters";
      if (value.trim().length > 50) return "First name cannot exceed 50 characters";
    }
    return null;
  },

  // Last name validation
  lastName: (value, isRequired = true) => {
    if (isRequired && (!value || value.trim() === '')) return "Last name is required";
    if (value && value.trim() !== '') {
      if (value.trim().length < 2) return "Last name must be at least 2 characters";
      if (value.trim().length > 50) return "Last name cannot exceed 50 characters";
    }
    return null;
  },

  // Gender validation
  gender: (value, isRequired = false) => {
    if (isRequired && (!value || value.trim() === '')) return "Gender is required";
    const validGenders = ["Male", "Female", "Other", "Prefer not to say"];
    if (value && value.trim() !== '' && !validGenders.includes(value)) {
      return "Please select a valid gender option";
    }
    return null;
  }
};

// Utility function to validate multiple fields
export const validateFields = (fields, requiredFields = []) => {
  const errors = {};
  let hasErrors = false;

  Object.keys(fields).forEach(fieldName => {
    const validator = validators[fieldName];
    if (validator) {
      const isRequired = requiredFields.includes(fieldName);
      const error = validator(fields[fieldName], isRequired);
      if (error) {
        errors[fieldName] = error;
        hasErrors = true;
      }
    }
  });

  return { errors, hasErrors };
};

// Utility function to validate a single field
export const validateField = (fieldName, value) => {
  const validator = validators[fieldName];
  return validator ? validator(value) : null;
};