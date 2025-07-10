import { Role, UserStatus } from '../constants/roles';

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  department?: string;
  phoneNumber?: string;
}

export interface UpdateUserRequest {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
  status?: UserStatus;
  department?: string;
  phoneNumber?: string;
  profileImage?: string;
}

export interface UserFilter {
  role?: Role;
  status?: UserStatus;
  department?: string;
  search?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}