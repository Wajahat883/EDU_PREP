# Quick API Reference

## Base URL

```
http://localhost:3001
```

## Authentication Endpoints

### 1. Register New User

```
POST /api/auth/register
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}

Response (201):
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Errors:
- 400: Validation failed (missing fields, invalid email, weak password)
- 409: User already exists
```

### 2. Login User

```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response (200):
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Errors:
- 400: Validation failed
- 401: Invalid credentials
```

### 3. Get Current User (Protected)

```
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response (200):
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "emailVerified": false
}

Errors:
- 401: No token provided / Invalid token
- 404: User not found
```

### 4. Update User Profile (Protected)

```
PUT /api/auth/profile
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Request Body:
{
  "firstName": "John",
  "lastName": "Doe",
  "timezone": "Asia/Karachi"
}

Response (200):
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "timezone": "Asia/Karachi"
}

Errors:
- 401: No token provided / Invalid token
- 404: User not found
```

### 5. Refresh Access Token

```
POST /api/auth/refresh
Content-Type: application/json

Request Body:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response (200):
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Errors:
- 400: Refresh token is required
- 401: Invalid refresh token / User not found
```

## cURL Examples

### Register

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### Get Current User

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Profile

```bash
curl -X PUT http://localhost:3001/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "timezone": "Asia/Karachi"
  }'
```

### Refresh Token

```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## HTTP Status Codes

| Code | Meaning      | Cause                                        |
| ---- | ------------ | -------------------------------------------- |
| 200  | OK           | Successful GET, PUT, POST request            |
| 201  | Created      | User successfully registered                 |
| 400  | Bad Request  | Validation failed, missing fields            |
| 401  | Unauthorized | Invalid token, no token, invalid credentials |
| 404  | Not Found    | User not found                               |
| 409  | Conflict     | User already exists (duplicate email)        |
| 500  | Server Error | Internal server error                        |

## Token Format

### Access Token

- Type: JWT
- Expiration: 15 minutes
- Payload:
  ```json
  {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "student",
    "iat": 1675123456,
    "exp": 1675124356
  }
  ```

### Refresh Token

- Type: JWT
- Expiration: 7 days
- Payload:
  ```json
  {
    "userId": "507f1f77bcf86cd799439011",
    "iat": 1675123456,
    "exp": 1675728256
  }
  ```

## Authentication Flow

1. **Register**: POST /api/auth/register → Get accessToken + refreshToken
2. **Store Tokens**: Save to localStorage
3. **Make Requests**: Include `Authorization: Bearer accessToken` header
4. **Token Expires**: Refresh using POST /api/auth/refresh + refreshToken
5. **Get Tokens**: New accessToken returned
6. **Update Header**: Use new token for subsequent requests

## MongoDB Data

**Connection**: `mongodb://admin:password123@mongodb:27017/eduprep_auth`

**Collection**: `users`

**Document Example**:

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "email": "john@example.com",
  "passwordHash": "$2a$12$...",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "emailVerified": false,
  "phone": "+923001234567",
  "timezone": "Asia/Karachi",
  "avatarUrl": "https://example.com/avatar.jpg",
  "lastLogin": ISODate("2026-02-05T16:30:00Z"),
  "isActive": true,
  "createdAt": ISODate("2026-02-05T10:00:00Z"),
  "updatedAt": ISODate("2026-02-05T16:30:00Z")
}
```

## Common Issues

### "User already exists"

- **Cause**: Email already registered
- **Solution**: Use different email or login instead

### "Invalid credentials"

- **Cause**: Wrong password or email
- **Solution**: Check email and password (case-sensitive)

### "Invalid token"

- **Cause**: Token expired or malformed
- **Solution**: Refresh token or login again

### "No token provided"

- **Cause**: Missing Authorization header
- **Solution**: Include `Authorization: Bearer TOKEN` in request

### "User not found"

- **Cause**: User deleted or doesn't exist
- **Solution**: Register new user
