import { useState, useCallback } from 'react';
import { validateEmail, validatePassword, sanitizeInput, RateLimiter } from '@/utils/validation';

const authRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes

export function useAuthForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback((data: {
    email?: string;
    password?: string;
    confirmPassword?: string;
    fullName?: string;
  }) => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (data.email && !validateEmail(data.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (data.password) {
      const passwordValidation = validatePassword(data.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0];
      }
    }

    // Confirm password validation
    if (data.confirmPassword && data.password !== data.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Name validation
    if (data.fullName && data.fullName.length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  const checkRateLimit = useCallback((email: string) => {
    if (authRateLimiter.isRateLimited(email)) {
      const remaining = authRateLimiter.getRemainingAttempts(email);
      setErrors({
        form: `Too many attempts. Please try again later. (${remaining} attempts remaining)`
      });
      return false;
    }
    return true;
  }, []);

  const sanitizeFormData = useCallback((data: Record<string, any>) => {
    const sanitized: Record<string, any> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string' && key !== 'password') {
        sanitized[key] = sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  }, []);

  return {
    errors,
    setErrors,
    isSubmitting,
    setIsSubmitting,
    validateForm,
    checkRateLimit,
    sanitizeFormData,
  };
}