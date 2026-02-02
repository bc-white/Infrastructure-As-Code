# Authentication Flow Testing Guide

## 🔐 OTP Authentication Test Setup

The mock backend now supports a complete OTP-based authentication flow with 4-digit codes.

### Test Accounts Available:
1. **Admin User**
   - Email: `admin@omcura.com`
   - Password: `password123`
   - Role: Super Admin

2. **Manager User**  
   - Email: `manager@omcura.com`
   - Password: `password123`
   - Role: Manager

### Testing Steps:

#### 1. Login Flow:
1. Open your app at `http://localhost:5175`
2. Navigate to login page
3. Enter email: `admin@omcura.com`
4. Enter password: `password123`
5. Click "Sign In"
6. You should see the OTP verification screen
7. Enter any 4-digit code (e.g., `1234`)
8. Click "Continue"
9. You should be logged in successfully

#### 2. Console Output:
When testing, check the terminal running the mock backend to see helpful debug messages:
- `📧 Login OTP for admin@omcura.com: XXXX (use any 4-digit code for testing)`
- `🔐 OTP Verification attempt: user_id=user-1, otp=1234`
- `✅ Login successful for user: admin@omcura.com`

#### 3. API Endpoints Updated:
- `POST /auth/login` - Returns `user_id` and `token` for OTP verification
- `POST /auth/verify-login-otp` - Accepts 4-digit OTP codes
- `POST /auth/signup` - Registration with OTP
- `POST /auth/verify-sign-up-otp` - Signup OTP verification
- `POST /auth/resend-otp` - Resend OTP functionality

### Key Changes Made:
✅ Changed OTP length from 6 digits to 4 digits
✅ Updated all OTP verification endpoints
✅ Added console logging for better debugging
✅ Fixed response data structure to match frontend expectations
✅ Added testing hints in the UI

### Troubleshooting:
- If OTP verification fails, restart the mock backend server
- Any 4-digit code should work for testing (1234, 5678, 0000, etc.)
- Check the console output for detailed debugging information
- Make sure both frontend (port 5175) and backend (port 3001) are running

### Next Steps:
1. Test the complete login flow in the browser
2. Test registration flow if available
3. Verify token storage and authenticated routes
4. Test logout functionality
