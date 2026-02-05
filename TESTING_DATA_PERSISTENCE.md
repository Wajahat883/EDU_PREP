# Testing Data Persistence in MongoDB

## Test Workflow

### 1. **Sign Up a New User**

- Go to http://localhost:3000/signup
- Fill in:
  - Full Name: "John Doe"
  - Email: "john@example.com"
  - Password: "SecurePass123"
  - Confirm Password: "SecurePass123"
  - ✓ Agree to terms
- Click "Sign Up"
- Should redirect to dashboard with user logged in

### 2. **Verify Data in MongoDB**

```bash
# Login to MongoDB container
docker exec -it eduprep-mongodb mongosh -u admin -p password123

# Use the auth database
use eduprep_auth

# View the newly created user
db.users.findOne({ email: "john@example.com" })
```

Expected output:

```json
{
  "_id": ObjectId("..."),
  "email": "john@example.com",
  "passwordHash": "$2a$12$...", // bcrypt hashed
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "emailVerified": false,
  "isActive": true,
  "createdAt": ISODate("2026-02-05T..."),
  "updatedAt": ISODate("2026-02-05T...")
}
```

### 3. **Test Login**

- Logout from dashboard
- Go to http://localhost:3000/login
- Enter:
  - Email: "john@example.com"
  - Password: "SecurePass123"
- Click "Sign In"
- Should redirect to dashboard

### 4. **Test Profile Update**

- From dashboard, navigate to profile settings (if available)
- Update timezone or other profile info
- In MongoDB, verify the update:

```bash
db.users.findOne({ email: "john@example.com" })
# Check if new fields are updated
```

### 5. **Verify Data Persistence**

```bash
# Count total users
db.users.countDocuments()

# List all users
db.users.find().pretty()

# Check indexes
db.users.getIndexes()
```

## Common Issues & Solutions

### Issue: User data not saving

**Solution**:

- Check auth service logs: `docker logs eduprep-auth-service`
- Verify MongoDB is running: `docker ps | grep mongodb`
- Check connection string in Docker environment

### Issue: Login fails with "Invalid credentials"

**Solution**:

- Password is case-sensitive
- Email matching is case-insensitive (lowercase)
- Verify user exists in MongoDB

### Issue: Cannot connect to MongoDB

**Solution**:

- Verify MongoDB container is healthy: `docker ps`
- Check MongoDB logs: `docker logs eduprep-mongodb`
- Verify connection credentials in docker-compose.yml

## Data Validation Rules

✅ **Email**

- Must be valid email format
- Unique per database (prevents duplicates)
- Automatically converted to lowercase

✅ **Password**

- Minimum 8 characters
- Must contain uppercase and lowercase
- Hashed with bcrypt (never stored in plaintext)

✅ **Name**

- First name and last name required
- Separated during signup (full name input)
- Stored separately in database

## MongoDB Connection Details

- **Host**: localhost (from host) / mongodb (from Docker)
- **Port**: 27017
- **Username**: admin
- **Password**: password123
- **Database**: eduprep_auth
- **Docker Container**: eduprep-mongodb

## API Endpoints

### Register User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Login User

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### Get Current User (requires token)

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Profile (requires token)

```bash
curl -X PUT http://localhost:3001/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "firstName": "Updated",
    "lastName": "Name",
    "timezone": "Asia/Karachi"
  }'
```

## Files Modified

1. ✅ `frontend/pages/signup.tsx` - Now calls real API
2. ✅ `frontend/pages/login.tsx` - Now calls real API
3. ✅ `frontend/next.config.js` - Removed redirect rule
4. ✅ Backend auth service already configured correctly
5. ✅ MongoDB schema properly defined

## Success Indicators

✅ Users can sign up without errors
✅ User data appears in MongoDB immediately
✅ Users can login with same credentials
✅ Profile data updates persist in MongoDB
✅ Logout clears frontend state
✅ Tokens are managed securely

## Troubleshooting Logs

```bash
# Frontend logs
docker logs eduprep-frontend -f

# Auth service logs
docker logs eduprep-auth-service -f

# MongoDB logs
docker logs eduprep-mongodb -f
```

## Next Steps

After verifying data persistence:

1. Test user authentication flow end-to-end
2. Verify other services can access user data via auth service
3. Implement profile management pages
4. Add role-based access control
5. Implement email verification (optional)
