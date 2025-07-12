import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { getClientIp, getUserAgent } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.register(req.body);
      
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'User registered successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const ipAddress = getClientIp(req);
      const userAgent = getUserAgent(req);

      const { user, tokens } = await AuthService.login(
        { email, password },
        ipAddress,
        userAgent
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Login successful',
        data: { user, tokens },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.substring(7) || '';
      await AuthService.logout(req.user!.id, token);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await TokenService.refreshTokens(refreshToken);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: { tokens },
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      await AuthService.changePassword(req.user!.id, currentPassword, newPassword);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Password changed successfully. Please login again.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getUserById(req.user!.id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
}