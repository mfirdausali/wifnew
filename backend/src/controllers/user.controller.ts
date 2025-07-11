import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { getPaginationParams, createPaginatedResponse } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';
import { UserRole } from '@prisma/client';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export class UserController {
  static async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserService.createUser(req.body, req.user!.id);
      
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'User created successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = getPaginationParams(req);
      const filter = {
        role: req.query.role as UserRole | undefined,
        status: req.query.status as any,
        department: req.query.department as string | undefined,
        search: req.query.search as string | undefined,
      };

      const { users, total } = await UserService.getUsers(filter, skip, limit);
      const response = createPaginatedResponse(users, total, page, limit);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...response,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const user = await UserService.getUserById(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const user = await UserService.updateUser(userId, req.body, req.user!.id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'User updated successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      const user = await UserService.updateUserRole(
        userId,
        role,
        req.user!.id,
        req.user!.role as UserRole
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'User role updated successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { status } = req.body;
      
      const user = await UserService.updateUserStatus(
        userId,
        status,
        req.user!.id,
        req.user!.role as UserRole
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'User status updated successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      
      await UserService.deleteUser(
        userId,
        req.user!.id,
        req.user!.role as UserRole
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await UserService.getUserStats();

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  }
}