# Authentication Setup Guide

This guide will help you set up JWT authentication for your application with PostgreSQL database.

## Backend Setup

### 1. Install Dependencies

```bash
cd Backend
pip install -r requirements.txt
```

### 2. Environment Configuration

Create a `.env` file in the `Backend` directory with the following variables:

```env
# Database Configuration
PGHOST=localhost
PGDATABASE=your_database_name
PGUSER=your_username
PGPASSWORD=your_password
PGPORT=5432

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Important**: Change the `JWT_SECRET_KEY` to a secure random string in production!

### 3. Database Setup

1. Make sure your PostgreSQL database is running
2. Create the database tables using your existing schema
3. Add the password column to the users table:

```sql
-- Run this SQL command in your database
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
```

Or use the provided migration file:
```bash
psql -d your_database_name -f Backend/Database/add_password_column.sql
```

### 4. Run the Backend

```bash
cd Backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend Setup

### 1. Install Dependencies

```bash
cd Frontend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `Frontend` directory:

```env
VITE_API_URL=http://localhost:8000
```

### 3. Run the Frontend

```bash
cd Frontend
npm run dev
```

## API Endpoints

The authentication system provides the following endpoints:

- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Authenticate user and get token
- `GET /auth/me` - Get current user information (requires authentication)
- `POST /auth/logout` - Logout user

## Authentication Flow

1. **Signup**: User registers with email, username, and password
2. **Login**: User authenticates with email and password
3. **Token**: Backend returns JWT token on successful authentication
4. **Authorization**: Frontend includes token in API requests
5. **Protected Routes**: Backend validates token for protected endpoints

## Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ PostgreSQL database integration
- ✅ Token expiration handling
- ✅ React context for state management
- ✅ Protected routes
- ✅ Error handling
- ✅ Loading states
- ✅ Beautiful UI components

## Security Features

- Passwords are hashed using bcrypt
- JWT tokens have expiration times
- Secure token storage in localStorage
- Automatic token validation
- Protected API endpoints

## Usage

### Backend

The authentication system is integrated into your existing FastAPI application. Protected routes can use the `get_current_active_user` dependency:

```python
from auth.dependencies import get_current_active_user

@app.get("/protected-route")
async def protected_route(current_user: dict = Depends(get_current_active_user)):
    return {"message": f"Hello {current_user['username']}!"}
```

### Frontend

The authentication state is managed through the AppContext:

```jsx
import { useApp } from './contexts/AppContext'

function MyComponent() {
  const { user, isAuthenticated, signOut } = useApp()
  
  if (!isAuthenticated) {
    return <div>Please sign in</div>
  }
  
  return (
    <div>
      <h1>Welcome {user.username}!</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

## Testing

1. Start both backend and frontend servers
2. Navigate to `/signup` to create a new account
3. Navigate to `/signin` to login with existing credentials
4. Access protected routes after authentication

## Troubleshooting

### Common Issues

1. **Database Connection Error**: Verify your PostgreSQL credentials in `.env`
2. **JWT Token Error**: Check that `JWT_SECRET_KEY` is set
3. **CORS Error**: Ensure CORS is configured for your frontend domain
4. **Missing Column**: Run the database migration to add `password_hash` column

### Debug Tips

- Check browser console for frontend errors
- Check backend logs for API errors
- Verify environment variables are loaded correctly
- Use browser dev tools to inspect network requests 