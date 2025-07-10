import { z } from 'zod';
import { UserRole, UserStatus } from '@prisma/client';
import { isStrongPassword } from '@utils/helpers';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().refine(isStrongPassword, {
    message: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character',
  }),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.nativeEnum(UserRole),
  department: z.string().optional(),
  phoneNumber: z.string().optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  department: z.string().optional(),
  phoneNumber: z.string().optional(),
  profilePicture: z.string().url().optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export const getUsersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  department: z.string().optional(),
  search: z.string().optional(),
});