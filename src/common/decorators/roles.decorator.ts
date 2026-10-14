import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export enum Permission {
  // Students
  STUDENT_CREATE = 'student:create',
  STUDENT_READ = 'student:read',
  STUDENT_UPDATE = 'student:update',
  STUDENT_DELETE = 'student:delete',

  // Teachers
  TEACHER_CREATE = 'teacher:create',
  TEACHER_READ = 'teacher:read',
  TEACHER_UPDATE = 'teacher:update',
  TEACHER_DELETE = 'teacher:delete',

  // Guardians
  GUARDIAN_CREATE = 'guardian:create',
  GUARDIAN_READ = 'guardian:read',
  GUARDIAN_UPDATE = 'guardian:update',

  // Academic
  ACADEMIC_CREATE = 'academic:create',
  ACADEMIC_READ = 'academic:read',
  ACADEMIC_UPDATE = 'academic:update',

  // Attendance
  ATTENDANCE_CREATE = 'attendance:create',
  ATTENDANCE_READ = 'attendance:read',

  // Exams
  EXAM_CREATE = 'exam:create',
  EXAM_READ = 'exam:read',
  EXAM_UPDATE = 'exam:update',

  // Results - Granular workflow permissions
  RESULT_ENTER = 'result:enter',
  RESULT_SUBMIT = 'result:submit',
  RESULT_VERIFY = 'result:verify',
  RESULT_APPROVE = 'result:approve',
  RESULT_PUBLISH = 'result:publish',
  RESULT_LOCK = 'result:lock',
  RESULT_READ = 'result:read',

  // Fees
  FEE_CREATE = 'fee:create',
  FEE_READ = 'fee:read',
  FEE_UPDATE = 'fee:update',
  FEE_PAYMENT = 'fee:payment',
  FEE_APPROVE = 'fee:approve',

  // Reports
  REPORT_GENERATE = 'report:generate',
  REPORT_EXPORT = 'report:export',

  // Certificates
  CERTIFICATE_CREATE = 'certificate:create',
  CERTIFICATE_VERIFY = 'certificate:verify',

  // Users
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // School
  SCHOOL_READ = 'school:read',
  SCHOOL_UPDATE = 'school:update',

  // SMS
  SMS_SEND = 'sms:send',
  SMS_TEMPLATE = 'sms:template',

  // Settings
  SETTINGS_READ = 'settings:read',
  SETTINGS_UPDATE = 'settings:update',

  // HR
  HR_CREATE = 'hr:create',
  HR_READ = 'hr:read',
  HR_UPDATE = 'hr:update',

  // Transport
  TRANSPORT_READ = 'transport:read',
  TRANSPORT_UPDATE = 'transport:update',

  // Library
  LIBRARY_READ = 'library:read',
  LIBRARY_UPDATE = 'library:update',

  // Nepal Compliance
  COMPLIANCE_DEO_REPORT = 'compliance:deo-report',
  COMPLIANCE_FREE_SEAT = 'compliance:free-seat',
  COMPLIANCE_ANNUAL_STATS = 'compliance:annual-stats',

  // Document Verification
  DOCUMENT_VERIFY = 'document:verify',

  // Date Management (BS/AD)
  DATE_BS_CONVERT = 'date:bs-convert',

  // Roles (dynamic RBAC administration)
  ROLE_MANAGE = 'role:manage',

  // All access
  ADMIN = 'admin:full',
}

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const ALL_PERMISSIONS = Object.values(Permission);

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: ALL_PERMISSIONS,
  [UserRole.PRINCIPAL]: [
    Permission.RESULT_READ,
    Permission.RESULT_APPROVE,
    Permission.RESULT_PUBLISH,
    Permission.CERTIFICATE_VERIFY,
    Permission.REPORT_GENERATE,
    Permission.REPORT_EXPORT,
    Permission.USER_READ,
    Permission.COMPLIANCE_DEO_REPORT,
    Permission.COMPLIANCE_ANNUAL_STATS,
    Permission.SCHOOL_READ,
  ],
  [UserRole.LIBRARIAN]: [
    Permission.LIBRARY_READ,
    Permission.LIBRARY_UPDATE,
    Permission.STUDENT_READ,
  ],
  [UserRole.ACCOUNTANT]: [
    Permission.FEE_CREATE,
    Permission.FEE_READ,
    Permission.FEE_UPDATE,
    Permission.FEE_PAYMENT,
    Permission.REPORT_GENERATE,
    Permission.REPORT_EXPORT,
  ],
  [UserRole.TEACHER]: [
    Permission.STUDENT_READ,
    Permission.GUARDIAN_READ,
    Permission.ACADEMIC_READ,
    Permission.ATTENDANCE_CREATE,
    Permission.ATTENDANCE_READ,
    Permission.EXAM_CREATE,
    Permission.EXAM_READ,
    Permission.RESULT_ENTER,
    Permission.RESULT_SUBMIT,
    Permission.RESULT_READ,
    Permission.REPORT_GENERATE,
  ],
  [UserRole.STAFF]: [
    Permission.STUDENT_READ,
    Permission.ATTENDANCE_READ,
    Permission.ACADEMIC_READ,
  ],
  [UserRole.STUDENT]: [
    Permission.STUDENT_READ,
    Permission.RESULT_READ,
    Permission.ATTENDANCE_READ,
    Permission.LIBRARY_READ,
  ],
  [UserRole.PARENT]: [
    Permission.STUDENT_READ,
    Permission.RESULT_READ,
    Permission.ATTENDANCE_READ,
    Permission.FEE_READ,
  ],
};
