export interface User {
  id: number;
  user_id: number;
  username: string;
  email: string;
  phone?: string;
  password: string;
  password_hash: string;
  role: string;
  school_id?: number;
  schoolId?: number;
  user_type?: string;
  full_name?: string;
  is_active: boolean;
  is_verified?: boolean;
  is_system?: boolean;
  locked_until?: Date;
  failed_login_attempts?: number;
  last_login_at?: Date;
  last_login_ip?: string;
  created_at: Date;
  createdAt: Date;
  updated_at: Date;
  updatedAt: Date;
}

export interface UserSession {
  id: number;
  session_id?: number | string;
  userId: number;
  token: string;
  expires_at?: Date;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuditLog {
  id: number;
  userId?: number;
  action: string;
  module: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
