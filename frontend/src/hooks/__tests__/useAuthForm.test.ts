import { renderHook, act } from '@testing-library/react';
import { useAuthForm } from '../useAuthForm';

describe('useAuthForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateForm', () => {
    it('should validate email format', () => {
      const { result } = renderHook(() => useAuthForm());

      act(() => {
        const isValid = result.current.validateForm({
          email: 'invalid-email',
          password: 'validPassword123',
        });
        expect(isValid).toBe(false);
        expect(result.current.errors.email).toBe('Please enter a valid email');
      });
    });

    it('should validate password length', () => {
      const { result } = renderHook(() => useAuthForm());

      act(() => {
        const isValid = result.current.validateForm({
          email: 'test@example.com',
          password: '123',
        });
        expect(isValid).toBe(false);
        expect(result.current.errors.password).toBe('Password must be at least 6 characters');
      });
    });

    it('should pass valid form', () => {
      const { result } = renderHook(() => useAuthForm());

      act(() => {
        const isValid = result.current.validateForm({
          email: 'test@example.com',
          password: 'validPassword123',
        });
        expect(isValid).toBe(true);
        expect(result.current.errors).toEqual({});
      });
    });
  });

  describe('checkRateLimit', () => {
    it('should allow first attempt', () => {
      const { result } = renderHook(() => useAuthForm());

      act(() => {
        const allowed = result.current.checkRateLimit('test@example.com');
        expect(allowed).toBe(true);
      });
    });

    it('should block after 5 attempts', () => {
      const { result } = renderHook(() => useAuthForm());

      act(() => {
        // Make 5 attempts
        for (let i = 0; i < 5; i++) {
          result.current.checkRateLimit('test@example.com');
        }

        // 6th attempt should be blocked
        const allowed = result.current.checkRateLimit('test@example.com');
        expect(allowed).toBe(false);
        expect(result.current.errors.form).toContain('Too many attempts');
      });
    });
  });

  describe('sanitizeFormData', () => {
    it('should trim whitespace and convert email to lowercase', () => {
      const { result } = renderHook(() => useAuthForm());

      act(() => {
        const sanitized = result.current.sanitizeFormData({
          email: '  TEST@EXAMPLE.COM  ',
          password: '  password123  ',
        });
        expect(sanitized.email).toBe('test@example.com');
        expect(sanitized.password).toBe('  password123  '); // Password should not be trimmed
      });
    });

    it('should escape HTML in inputs', () => {
      const { result } = renderHook(() => useAuthForm());

      act(() => {
        const sanitized = result.current.sanitizeFormData({
          email: 'test@example.com<script>alert("xss")</script>',
          password: 'password123',
        });
        expect(sanitized.email).not.toContain('<script>');
        expect(sanitized.email).toContain('&lt;script&gt;');
      });
    });
  });
});