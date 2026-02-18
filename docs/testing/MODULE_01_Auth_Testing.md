# Module 1: Authentication & Authorization - Test Report

## 1. Test Scope

### Functionalities Tested:

- User login (username/email + password)
- User registration
- JWT token generation & refresh
- Password change (with verification)
- Forgot/reset password flow
- Logout (single device & all devices)
- Session management

### Critical Flows for Nepali Schools:

- First-time password change on login
- Multi-device session handling
- Password reset for staff/teachers

---

## 2. API Test Cases

### 2.1 Happy Path Tests

#### TC-001: Successful Login with Email

```
POST /api/auth/login
{
  "username": "admin@school.edu.np",
  "password": "SecurePass123!"
}
```

**Expected:** 200 OK with access_token, refresh_token, user profile

#### TC-002: Successful Login with Username

```
POST /api/auth/login
{
  "username": "admin",
  "password": "SecurePass123!"
}
```

**Expected:** 200 OK

#### TC-003: Successful Registration

```
POST /api/auth/register
{
  "email": "newteacher@school.edu.np",
  "password": "Pass123456",
  "username": "newteacher",
  "role": "teacher",
  "schoolId": 1
}
```

**Expected:** 201 Created with user details

#### TC-004: Token Refresh

```
POST /api/auth/refresh
{
  "refreshToken": "<valid_refresh_token>"
}
```

**Expected:** 200 OK with new access_token

#### TC-005: Password Change (First Login)

```
POST /api/auth/change-password
Headers: Authorization: Bearer <token>
{
  "currentPassword": "temp_password",
  "newPassword": "NewPass123!"
}
```

**Expected:** 200 OK

#### TC-006: Logout from Single Device

```
POST /api/auth/logout
Headers: Authorization: Bearer <token>
{
  "refreshToken": "<token>"
}
```

**Expected:** 200 OK

#### TC-007: Logout from All Devices

```
POST /api/auth/logout-all
Headers: Authorization: Bearer <token>
```

**Expected:** 200 OK

#### TC-008: Get User Profile

```
GET /api/auth/profile
Headers: Authorization: Bearer <token>
```

**Expected:** 200 OK with user profile

---

### 2.2 Negative Tests

#### TC-009: Login with Invalid Password

```
POST /api/auth/login
{
  "username": "admin@school.edu.np",
  "password": "WrongPassword"
}
```

**Expected:** 401 Unauthorized - "Invalid credentials"

#### TC-010: Login with Non-existent User

```
POST /api/auth/login
{
  "username": "nonexistent@school.edu.np",
  "password": "SomePass123"
}
```

**Expected:** 401 Unauthorized

#### TC-011: Login with Missing Credentials

```
POST /api/auth/login
{}
```

**Expected:** 400 Bad Request - Validation error

#### TC-012: Login with Empty Password

```
POST /api/auth/login
{
  "username": "admin@school.edu.np",
  "password": ""
}
```

**Expected:** 400 Bad Request

#### TC-013: Refresh with Invalid Token

```
POST /api/auth/refresh
{
  "refreshToken": "invalid_token"
}
```

**Expected:** 401 Unauthorized

#### TC-014: Refresh with Expired Token

```
POST /api/auth/refresh
{
  "refreshToken": "<expired_token>"
}
```

**Expected:** 401 Unauthorized - "Token expired"

#### TC-015: Change Password with Wrong Current Password

```
POST /api/auth/change-password
Headers: Authorization: Bearer <token>
{
  "currentPassword": "WrongPassword",
  "newPassword": "NewPass123!"
}
```

**Expected:** 401 Unauthorized

#### TC-016: Register with Duplicate Email

```
POST /api/auth/register
{
  "email": "existing@school.edu.np",
  ...
}
```

**Expected:** 409 Conflict - "Email already exists"

#### TC-017: Register with Invalid Email Format

```
POST /api/auth/register
{
  "email": "notanemail",
  ...
}
```

**Expected:** 400 Bad Request - Validation error

---

### 2.3 Authorization Tests

#### TC-018: Access Protected Endpoint Without Token

```
GET /api/auth/profile
```

**Expected:** 401 Unauthorized

#### TC-019: Access Protected Endpoint with Invalid Token

```
GET /api/auth/profile
Headers: Authorization: Bearer invalid_token
```

**Expected:** 401 Unauthorized

#### TC-020: Access Protected Endpoint with Malformed Token

```
GET /api/auth/profile
Headers: Authorization: Bearer "malformed.token.here"
```

**Expected:** 401 Unauthorized

#### TC-021: Role-Based Access - Admin Only Endpoint

```
POST /api/users
Headers: Authorization: Bearer <teacher_token>
```

**Expected:** 403 Forbidden (if teacher tries to create user)

---

### 2.4 Validation Tests

#### TC-022: Password Too Short (< 6 chars)

```
POST /api/auth/login
{
  "username": "admin",
  "password": "123"
}
```

**Expected:** 400 Bad Request - "password must be at least 6 characters"

#### TC-023: Password Too Long (> 100 chars)

```
POST /api/auth/login
{
  "username": "admin",
  "password": "<100+ characters>"
}
```

**Expected:** 400 or allow (check implementation)

#### TC-024: Username with Special Characters (XSS attempt)

```
POST /api/auth/login
{
  "username": "<script>alert('xss')</script>",
  "password": "SomePass"
}
```

**Expected:** Should sanitize input, 401 if invalid

#### TC-025: SQL Injection in Username

```
POST /api/auth/login
{
  "username": "admin' OR '1'='1",
  "password": "SomePass"
}
```

**Expected:** Should use parameterized queries, return 401

---

### 2.5 Boundary Tests

#### TC-026: Token Expiration Test

- Login and wait for token to expire (JWT_EXPIRES_IN = 2h)
- Use expired token to access protected endpoint
  **Expected:** 401 Unauthorized - "JWT expired"

#### TC-027: Very Long Session Test

- Login and keep session alive for extended period
- Verify refresh token rotation works

#### TC-028: Concurrent Login from Multiple Devices

- Login from 2+ devices simultaneously
  **Expected:** Both sessions should work independently

---

## 3. Security Testing

### TC-029: JWT Secret Hardcoded Check

- Verify JWT_SECRET is loaded from environment
- Should NOT be hardcoded in source

### TC-030: Password Not Returned in Response

- After login, password should NOT be in response
  **Expected:** Password field excluded

### TC-031: Password Hashing Verification

- Check database to ensure passwords are hashed (bcrypt)
  **Expected:** Stored passwords should be hashed, not plaintext

### TC-032: Rate Limiting on Login

- Attempt 10+ failed logins rapidly
  **Expected:** 429 Too Many Requests after limit

### TC-033: Token Not in URL

- Tokens should be in Authorization header, NOT in URL
  **Expected:** No token leakage in logs/URLs

---

## 4. Nepal-Specific Edge Cases

### TC-034: Unicode Support in Password

- Password with Nepali characters: "पासवर्ड"
  **Expected:** Handle properly (or restrict to ASCII)

### TC-035: Nepali Email Domains

- Email like "प्रधान@विद्यालय.edu.np"
  **Expected:** Proper handling or clear error

### TC-036: First-time Login Flow

- New user must change password on first login
  **Expected:** User with must_change_password=true cannot access until changed

---

## 5. Test Results Summary

| Category       | Tests | Passed | Failed | Notes               |
| -------------- | ----- | ------ | ------ | ------------------- |
| Happy Path     | 8     | -      | -      | Need running server |
| Negative       | 9     | -      | -      | Need running server |
| Authorization  | 4     | -      | -      | Need running server |
| Validation     | 4     | -      | -      | Need running server |
| Security       | 5     | -      | -      | Need running server |
| Nepal-Specific | 3     | -      | -      | Need running server |

---

## 6. Bug Reporting

### Bug Template

**ID:** AUTH-001  
**Title:** [Brief description]  
**Severity:** Critical / High / Medium / Low  
**Steps to Reproduce:**

1. ...
2. ...

**Expected Behavior:**  
...

**Actual Behavior:**  
...

**Environment:**

- API: http://localhost:3001/api
- Database: PostgreSQL

---

## 7. Jest Test Examples

```typescript
// auth.service.spec.ts - Add these tests
describe('AuthService - Security Tests', () => {
  it('should hash password before storing', async () => {
    const plainPassword = 'TestPass123';
    await authService.register(createUserDto);
    const storedUser = await userService.findByEmail(createUserDto.email);
    expect(storedUser.password).not.toBe(plainPassword);
  });

  it('should not allow login with incorrect password', async () => {
    await authService.register(createUserDto);
    const result = await authService.login({
      username: createUserDto.email,
      password: 'wrongpassword',
    });
    expect(result).toBeNull();
  });

  it('should generate different tokens for different sessions', async () => {
    const token1 = await authService.login(credentials);
    const token2 = await authService.login(credentials);
    expect(token1.access_token).not.toBe(token2.access_token);
  });
});
```

---

## 8. Next Steps

Run these tests against the live server and document results. Proceed to Module 2: School Setup.
