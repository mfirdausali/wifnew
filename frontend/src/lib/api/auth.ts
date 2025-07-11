import { authClient } from './client';
import { TokenManager } from './tokenManager';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  tokens: AuthTokens;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    permissions: string[];
  };
}

export class AuthService {
  private tokenManager: TokenManager;
  private refreshPromise: Promise<AuthTokens> | null = null;
  
  constructor() {
    this.tokenManager = new TokenManager();
  }
  
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await authClient.post<{ data: LoginResponse }>('/login', credentials);
    const { tokens, user } = response.data.data;
    
    this.tokenManager.setTokens(tokens);
    
    if (credentials.rememberMe) {
      this.tokenManager.enablePersistence();
    }
    
    return { tokens, user };
  }
  
  async logout(): Promise<void> {
    try {
      const refreshToken = this.tokenManager.getRefreshToken();
      if (refreshToken) {
        await authClient.post('/logout', { refreshToken });
      }
    } finally {
      this.tokenManager.clearTokens();
    }
  }
  
  async refreshTokens(): Promise<AuthTokens> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    
    const refreshToken = this.tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    this.refreshPromise = authClient
      .post<{ data: AuthTokens }>('/refresh', { refreshToken })
      .then((response) => {
        const tokens = response.data.data;
        this.tokenManager.setTokens(tokens);
        this.refreshPromise = null;
        return tokens;
      })
      .catch((error) => {
        this.refreshPromise = null;
        this.tokenManager.clearTokens();
        throw error;
      });
    
    return this.refreshPromise;
  }
  
  async getCurrentUser(): Promise<any> {
    const response = await authClient.get('/me');
    return response.data.data;
  }
  
  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    await authClient.post('/update-password', {
      currentPassword,
      newPassword,
    });
  }
  
  isAuthenticated(): boolean {
    return this.tokenManager.hasValidToken();
  }
  
  getAccessToken(): string | null {
    return this.tokenManager.getAccessToken();
  }
  
  getTokenManager(): TokenManager {
    return this.tokenManager;
  }
}

export const authService = new AuthService();