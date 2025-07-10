import { z } from 'zod';
import { isStrongPassword } from '@utils/helpers';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().refine(isStrongPassword, {
    message: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character',
  }),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().refine(isStrongPassword, {
    message: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character',
  }),
});