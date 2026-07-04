# Authentication System Documentation

## Overview

This authentication system implements a secure, JWT-based authentication flow with OTP (One-Time Password) verification via email. It uses Redis for session management and OTP storage.

## Architecture

```
src/modules/auth/
├── auth.ctrl.ts       # Controllers (login, verifyOtp, refresh, logout)
├── auth.routes.ts     # Route definitions with validation & rate limiting
├── email.svc.ts       # Email service for sending OTP
├── email.template.ts  # HTML email template
├── otp.service.ts     # OTP generation and verification
└── session.svc.ts     # Redis session management
```

## Authentication Flow

### 1. Login (`POST /api/v1/auth/login`)

```json
// Request
{
  "email": "admin@example.com",
  "password": "StrongP@ssw0rd"
}

// Response (200) - 2FA disabled
{
  "success": true,
  "requires2FA": false,
  "message": "Verification code sent to email."
}

// Response (200) - 2FA enabled
{
  "success": true,
  "requires2FA": true,
  "message": "2FA verification required. Please provide your 2FA code."
}
```

**What happens:**
- Validates email and password
- If 2FA is **disabled**:
  - Generates 6-digit OTP code
  - Stores hashed OTP in Redis (expires in 3 minutes)
  - Sends OTP to user's email
- If 2FA is **enabled**:
  - Skips OTP, requires 2FA code instead

**Rate Limit:** 15 requests per hour per IP

---

### 2. Verify OTP (`POST /api/v1/auth/verify-otp`)

#### Case A: 2FA Disabled

```json
// Request
{
  "email": "admin@example.com",
  "otp": "123456"
}

// Response (200)
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**What happens:**
- Validates OTP code
- Creates session in Redis (expires in 7 days)
- Generates access token (15 min) and refresh token (7 days)
- Sets refresh token as HttpOnly cookie

#### Case B: 2FA Enabled

```json
// Request
{
  "email": "admin@example.com",
  "twoFACode": "654321"
}

// Response (200)
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**What happens:**
- Validates 2FA TOTP code (no OTP/email needed)
- Creates session in Redis (expires in 7 days)
- Generates access token (15 min) and refresh token (7 days)
- Sets refresh token as HttpOnly cookie

**Rate Limit:** 5 requests per 3 minutes per IP

---

### 3. Refresh Access Token (`POST /api/v1/auth/refresh`)

```
// Request (no body needed, cookie sent automatically)
POST /api/v1/auth/refresh
Cookie: refreshToken=<token>

// Response (200)
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**What happens:**
- Validates refresh token from cookie
- Checks session validity in Redis
- Generates new access token

---

### 4. Logout (`POST /api/v1/auth/logout`)

```
// Request
POST /api/v1/auth/logout
Cookie: refreshToken=<token>

// Response (200)
{
  "success": true,
  "message": "Logged out successfully"
}
```

**What happens:**
- Invalidates session in Redis
- Clears refresh token cookie

---

## Protected Routes

Use the `authenticate` middleware to protect your routes:

```typescript
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import type { AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

router.get('/admin/profile', authenticate, (req: AuthRequest, res) => {
  // req.admin is available here
  res.json({
    id: req.admin.id,
    email: req.admin.email,
  });
});

export default router;
```

### Making Requests to Protected Routes

```bash
curl -X GET http://localhost:3000/api/v1/admin/profile \
  -H "Authorization: Bearer <your_access_token>"
```

---

## Validation

All endpoints use Joi validation with the following rules:

### Login
- **email**: Required, valid email format, auto-trimmed and lowercased
- **password**: Required, non-empty

### Verify OTP
- **email**: Required, valid email format, auto-trimmed and lowercased
- **otp**: Required, exactly 6 digits

### Password Requirements (for registration)
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)
- At least one special character (@$!%*?&)

---

## Security Features

1. **JWT Tokens**
   - Access token: 15 minutes expiration
   - Refresh token: 7 days expiration (HttpOnly cookie)

2. **Session Management**
   - Sessions stored in Redis
   - Can be invalidated on logout or password change

3. **OTP Verification**
   - 6-digit codes
   - 3-minute expiration
   - Single-use (deleted after verification)

4. **Rate Limiting**
   - Login: 15 requests/hour
   - OTP verification: 5 requests/3 minutes

5. **Password Hashing**
   - bcrypt with 12 salt rounds

6. **Email Normalization**
   - All emails trimmed and lowercased

---

## Environment Variables

Required `.env` variables:

```env
# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES_SECONDS=604800

# Redis
REDIS_URL=redis://127.0.0.1:6379

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Your Name <your_email@gmail.com>"

# Server
PORT=3000
NODE_ENV=development
```

---

## Error Responses

### 400 Bad Request (Validation Error)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "status": "fail",
  "message": "Invalid email or password"
}
```

### 429 Too Many Requests
```json
{
  "status": "fail",
  "message": "Too many login attempts from this IP. Try again later."
}
```

---

## Testing

### Using cURL

```bash
# 1. Login (2FA disabled case)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"StrongP@ssw0rd"}'

# 2. Verify OTP (2FA disabled)
curl -X POST http://localhost:3000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"admin@example.com","otp":"123456"}'

# OR

# 1. Login (2FA enabled case)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"StrongP@ssw0rd"}'

# Response: {"requires2FA": true}

# 2. Verify with 2FA code (no OTP needed)
curl -X POST http://localhost:3000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"admin@example.com","twoFACode":"654321"}'

# 3. Access protected route
curl -X GET http://localhost:3000/api/v1/admin/profile \
  -H "Authorization: Bearer <access_token_from_step_2>"

# 4. Refresh token
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -b cookies.txt

# 5. Logout
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -b cookies.txt
```

---

## Common Issues & Solutions

### "SMTP credentials are not defined"
Make sure all SMTP environment variables are set in `.env`

### "Session expired or invalidated"
The refresh token session has been invalidated. User needs to login again.

### "Access token has expired"
Use the refresh endpoint to get a new access token.

### Email not received
Check SMTP configuration and spam folder. In development, OTP is also logged to console.
