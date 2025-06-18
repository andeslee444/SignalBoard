// CSRF Protection
class CSRFTokenManager {
  private token: string | null = null;
  private readonly tokenKey = 'csrf_token';

  generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    this.token = token;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.tokenKey, token);
    }
    
    return token;
  }

  getToken(): string {
    if (!this.token && typeof window !== 'undefined') {
      this.token = sessionStorage.getItem(this.tokenKey) || this.generateToken();
    }
    return this.token || this.generateToken();
  }

  validateToken(token: string): boolean {
    return token === this.getToken();
  }

  refreshToken(): string {
    return this.generateToken();
  }
}

export const csrfToken = new CSRFTokenManager();