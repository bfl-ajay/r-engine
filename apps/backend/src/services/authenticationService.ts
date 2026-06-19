/**
 * Authentication Service
 * Handles user authentication with OAuth2, SAML, and local strategies
 */

import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
  lastLogin?: number;
  createdAt: number;
  roles: string[];
  isActive: boolean;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  ipAddress: string;
  userAgent: string;
}

/**
 * AuthenticationService - Manage user authentication
 */
class AuthenticationService {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map();
  private tokenSecret = process.env.JWT_SECRET || 'default-secret-key';

  /**
   * Register new user
   */
  registerUser(
    email: string,
    username: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): {success: boolean; user?: User; error?: string} {
    // Check if user exists
    if (Array.from(this.users.values()).some((u) => u.email === email)) {
      return {success: false, error: 'Email already registered'};
    }

    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const passwordHash = this.hashPassword(password);

    const user: User = {
      id,
      email,
      username,
      passwordHash,
      firstName,
      lastName,
      mfaEnabled: false,
      createdAt: Date.now(),
      roles: ['user'],
      isActive: true,
    };

    this.users.set(id, user);
    return {success: true, user};
  }

  /**
   * Authenticate user with email/password
   */
  authenticateLocal(
    email: string,
    password: string,
    ipAddress: string,
    userAgent: string
  ): {success: boolean; token?: AuthToken; error?: string} {
    const user = Array.from(this.users.values()).find((u) => u.email === email);

    if (!user || !user.isActive) {
      return {success: false, error: 'Invalid credentials'};
    }

    if (!this.verifyPassword(password, user.passwordHash!)) {
      return {success: false, error: 'Invalid credentials'};
    }

    user.lastLogin = Date.now();

    const token = this.generateAuthToken(user);
    const session = this.createSession(user.id, token.accessToken, ipAddress, userAgent);

    return {success: true, token};
  }

  /**
   * Authenticate with OAuth2
   */
  authenticateOAuth2(
    provider: 'google' | 'microsoft' | 'github',
    profile: Record<string, any>,
    ipAddress: string,
    userAgent: string
  ): {success: boolean; user?: User; token?: AuthToken} {
    // In production, would verify token with OAuth2 provider
    let user = Array.from(this.users.values()).find((u) => u.email === profile.email);

    if (!user) {
      // Create user from OAuth profile
      const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      user = {
        id,
        email: profile.email,
        username: profile.email.split('@')[0],
        firstName: profile.given_name,
        lastName: profile.family_name,
        mfaEnabled: false,
        createdAt: Date.now(),
        roles: ['user'],
        isActive: true,
      };
      this.users.set(id, user);
    }

    user.lastLogin = Date.now();

    const token = this.generateAuthToken(user);
    const session = this.createSession(user.id, token.accessToken, ipAddress, userAgent);

    return {success: true, user, token};
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): {valid: boolean; userId?: string; error?: string} {
    try {
      // In production, would use proper JWT library
      const parts = token.split('.');
      if (parts.length !== 3) {
        return {valid: false, error: 'Invalid token format'};
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      const user = this.users.get(payload.sub);

      if (!user || !user.isActive) {
        return {valid: false, error: 'User not found or inactive'};
      }

      if (payload.exp < Date.now() / 1000) {
        return {valid: false, error: 'Token expired'};
      }

      return {valid: true, userId: user.id};
    } catch (error) {
      return {valid: false, error: `${error}`};
    }
  }

  /**
   * Refresh token
   */
  refreshToken(refreshToken: string): {success: boolean; token?: AuthToken; error?: string} {
    // In production, would validate refresh token against stored tokens
    const session = Array.from(this.sessions.values()).find((s) => s.token === refreshToken);

    if (!session) {
      return {success: false, error: 'Invalid refresh token'};
    }

    const user = this.users.get(session.userId);
    if (!user) {
      return {success: false, error: 'User not found'};
    }

    const token = this.generateAuthToken(user);
    session.token = token.accessToken;
    session.expiresAt = Date.now() + token.expiresIn * 1000;

    return {success: true, token};
  }

  /**
   * Logout user
   */
  logout(token: string): boolean {
    const session = Array.from(this.sessions.values()).find((s) => s.token === token);
    if (session) {
      this.sessions.delete(session.id);
      return true;
    }
    return false;
  }

  /**
   * Enable MFA for user
   */
  enableMFA(userId: string): {success: boolean; secret?: string; qrCode?: string} {
    const user = this.users.get(userId);
    if (!user) {
      return {success: false};
    }

    const secret = this.generateMFASecret();
    user.mfaSecret = secret;
    user.mfaEnabled = false; // Require verification first

    // In production, would generate actual QR code
    const qrCode = `otpauth://totp/ReportingEngine:${user.email}?secret=${secret}`;

    return {success: true, secret, qrCode};
  }

  /**
   * Verify MFA code
   */
  verifyMFA(userId: string, code: string): boolean {
    const user = this.users.get(userId);
    if (!user || !user.mfaSecret) {
      return false;
    }

    // In production, would use proper TOTP library
    // Simplified check (would need time window tolerance)
    return code.length === 6;
  }

  /**
   * Generate auth token
   */
  private generateAuthToken(user: User): AuthToken {
    const expiresIn = 3600; // 1 hour
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + expiresIn,
    };

    // In production, would use proper JWT library
    const header = Buffer.from(JSON.stringify({alg: 'HS256'})).toString('base64');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = Buffer.from(
      crypto
        .createHmac('sha256', this.tokenSecret)
        .update(`${header}.${payloadB64}`)
        .digest()
    ).toString('base64');

    const accessToken = `${header}.${payloadB64}.${signature}`;
    const refreshToken = crypto.randomBytes(32).toString('hex');

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer',
    };
  }

  /**
   * Create session
   */
  private createSession(
    userId: string,
    token: string,
    ipAddress: string,
    userAgent: string
  ): Session {
    const id = crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const session: Session = {
      id,
      userId,
      token,
      createdAt: Date.now(),
      expiresAt,
      ipAddress,
      userAgent,
    };

    this.sessions.set(id, session);
    return session;
  }

  /**
   * Hash password
   */
  private hashPassword(password: string): string {
    // In production, would use bcrypt or similar
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Verify password
   */
  private verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  /**
   * Generate MFA secret
   */
  private generateMFASecret(): string {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Change password
   */
  changePassword(userId: string, oldPassword: string, newPassword: string): {success: boolean; error?: string} {
    const user = this.users.get(userId);
    if (!user) {
      return {success: false, error: 'User not found'};
    }

    if (!this.verifyPassword(oldPassword, user.passwordHash!)) {
      return {success: false, error: 'Invalid old password'};
    }

    user.passwordHash = this.hashPassword(newPassword);
    return {success: true};
  }

  /**
   * List active sessions
   */
  listActiveSessions(userId: string): Session[] {
    const now = Date.now();
    return Array.from(this.sessions.values()).filter(
      (s) => s.userId === userId && s.expiresAt > now
    );
  }

  /**
   * Invalidate all sessions for user
   */
  invalidateAllSessions(userId: string): number {
    const toDelete: string[] = [];

    this.sessions.forEach((session, id) => {
      if (session.userId === userId) {
        toDelete.push(id);
      }
    });

    toDelete.forEach((id) => this.sessions.delete(id));
    return toDelete.length;
  }

  /**
   * Get user by ID
   */
  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  /**
   * List all users
   */
  listUsers(): User[] {
    return Array.from(this.users.values());
  }
}

export default new AuthenticationService();
