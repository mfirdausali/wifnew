import Cookies from 'js-cookie';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class TokenManager {
  private static ACCESS_TOKEN_KEY = 'accessToken';
  private static REFRESH_TOKEN_KEY = 'refreshToken';
  private static EXPIRES_AT_KEY = 'expiresAt';
  private static PERSISTENCE_KEY = 'authPersistence';
  
  private storage: 'cookie' | 'localStorage' | 'sessionStorage' = 'cookie';
  
  constructor() {
    // Check if persistence is enabled
    if (typeof window !== 'undefined') {
      const persistence = localStorage.getItem(TokenManager.PERSISTENCE_KEY);
      if (persistence === 'true') {
        this.storage = 'localStorage';
      } else if (persistence === 'session') {
        this.storage = 'sessionStorage';
      }
    }
  }
  
  setTokens(tokens: AuthTokens): void {
    const expiresAt = Date.now() + tokens.expiresIn * 1000;
    
    if (this.storage === 'cookie') {
      // Store in cookies (httpOnly cookies should be set by backend)
      Cookies.set(TokenManager.ACCESS_TOKEN_KEY, tokens.accessToken, { 
        expires: tokens.expiresIn / (24 * 60 * 60), // Convert seconds to days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      Cookies.set(TokenManager.REFRESH_TOKEN_KEY, tokens.refreshToken, { 
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      Cookies.set(TokenManager.EXPIRES_AT_KEY, expiresAt.toString(), {
        expires: tokens.expiresIn / (24 * 60 * 60),
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
    } else {
      const storageObj = this.storage === 'localStorage' ? localStorage : sessionStorage;
      storageObj.setItem(TokenManager.ACCESS_TOKEN_KEY, tokens.accessToken);
      storageObj.setItem(TokenManager.REFRESH_TOKEN_KEY, tokens.refreshToken);
      storageObj.setItem(TokenManager.EXPIRES_AT_KEY, expiresAt.toString());
    }
  }
  
  getAccessToken(): string | null {
    if (this.storage === 'cookie') {
      return Cookies.get(TokenManager.ACCESS_TOKEN_KEY) || null;
    }
    
    const storageObj = this.storage === 'localStorage' ? localStorage : sessionStorage;
    return storageObj.getItem(TokenManager.ACCESS_TOKEN_KEY);
  }
  
  getRefreshToken(): string | null {
    if (this.storage === 'cookie') {
      return Cookies.get(TokenManager.REFRESH_TOKEN_KEY) || null;
    }
    
    const storageObj = this.storage === 'localStorage' ? localStorage : sessionStorage;
    return storageObj.getItem(TokenManager.REFRESH_TOKEN_KEY);
  }
  
  hasValidToken(): boolean {
    const accessToken = this.getAccessToken();
    const expiresAt = this.getExpiresAt();
    
    if (!accessToken || !expiresAt) {
      return false;
    }
    
    // Check if token is expired (with 1 minute buffer)
    return Date.now() < expiresAt - 60000;
  }
  
  getExpiresAt(): number | null {
    let expiresAtStr: string | null = null;
    
    if (this.storage === 'cookie') {
      expiresAtStr = Cookies.get(TokenManager.EXPIRES_AT_KEY) || null;
    } else {
      const storageObj = this.storage === 'localStorage' ? localStorage : sessionStorage;
      expiresAtStr = storageObj.getItem(TokenManager.EXPIRES_AT_KEY);
    }
    
    return expiresAtStr ? parseInt(expiresAtStr) : null;
  }
  
  clearTokens(): void {
    if (this.storage === 'cookie') {
      Cookies.remove(TokenManager.ACCESS_TOKEN_KEY);
      Cookies.remove(TokenManager.REFRESH_TOKEN_KEY);
      Cookies.remove(TokenManager.EXPIRES_AT_KEY);
    } else {
      const storageObj = this.storage === 'localStorage' ? localStorage : sessionStorage;
      storageObj.removeItem(TokenManager.ACCESS_TOKEN_KEY);
      storageObj.removeItem(TokenManager.REFRESH_TOKEN_KEY);
      storageObj.removeItem(TokenManager.EXPIRES_AT_KEY);
    }
    
    // Clear from all storages to be safe
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(TokenManager.ACCESS_TOKEN_KEY);
      localStorage.removeItem(TokenManager.ACCESS_TOKEN_KEY);
      Cookies.remove(TokenManager.ACCESS_TOKEN_KEY);
    }
  }
  
  enablePersistence(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(TokenManager.PERSISTENCE_KEY, 'true');
    
    // Move tokens to localStorage
    const tokens = this.getStoredTokens();
    if (tokens) {
      this.storage = 'localStorage';
      this.setTokens({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: Math.max(0, (tokens.expiresAt - Date.now()) / 1000),
      });
    }
  }
  
  disablePersistence(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(TokenManager.PERSISTENCE_KEY);
    
    // Move tokens to cookies
    const tokens = this.getStoredTokens();
    if (tokens) {
      this.storage = 'cookie';
      this.setTokens({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: Math.max(0, (tokens.expiresAt - Date.now()) / 1000),
      });
    }
  }
  
  private getStoredTokens(): StoredTokens | null {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    const expiresAt = this.getExpiresAt();
    
    if (!accessToken || !refreshToken || !expiresAt) {
      return null;
    }
    
    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  }
}