export interface User {
  user_id: number;
  school_id: number;
  username: string;
  email: string;
  phone: string;
  password_hash: string;
  full_name: string;
  user_type: string;
  is_verified: boolean;
  is_active: boolean;
  failed_login_attempts: number;
  locked_until: Date | null;
  last_login_at: Date | null;
  last_login_ip: string | null;
  last_login_agent: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface UserSession {
  session_id: string;
  user_id: number;
  school_id: number;
  refresh_token_hash: string;
  device_name: string;
  ip_address: string;
  user_agent: string;
  last_active_at: Date;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AuditLog {
  audit_id: number;
  user_id: number | null;
  school_id: number | null;
  action: string;
  module: string;
  resource_id: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}
