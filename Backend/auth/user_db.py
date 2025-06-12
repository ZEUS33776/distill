import asyncpg
from typing import Optional, Dict, Any
from Database.connection import db
from auth.auth_utils import hash_password, verify_password
from fastapi import HTTPException, status

class UserDB:
    
    @staticmethod
    async def create_user(email: str, username: str, password: str) -> Dict[str, Any]:
        """Create a new user"""
        hashed_password = hash_password(password)
        
        async with db.get_connection() as conn:
            try:
                # Check if user already exists
                existing_user = await conn.fetchrow(
                    "SELECT user_id FROM users WHERE email = $1",
                    email
                )
                if existing_user:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Email already registered"
                    )
                
                # Create new user
                user = await conn.fetchrow(
                    """
                    INSERT INTO users (email, username, password_hash) 
                    VALUES ($1, $2, $3) 
                    RETURNING user_id, email, username, created_at, is_active
                    """,
                    email, username, hashed_password
                )
                return dict(user)
                
            except asyncpg.UniqueViolationError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
    
    @staticmethod
    async def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate a user by email and password"""
        async with db.get_connection() as conn:
            user = await conn.fetchrow(
                """
                SELECT user_id, email, username, password_hash, created_at, is_active 
                FROM users 
                WHERE email = $1 AND is_active = true
                """,
                email
            )
            
            if not user:
                return None
            
            if not verify_password(password, user['password_hash']):
                return None
            
            # Return user data without password
            return {
                'user_id': str(user['user_id']),
                'email': user['email'],
                'username': user['username'],
                'created_at': user['created_at'],
                'is_active': user['is_active']
            }
    
    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        async with db.get_connection() as conn:
            user = await conn.fetchrow(
                """
                SELECT user_id, email, username, created_at, is_active 
                FROM users 
                WHERE user_id = $1 AND is_active = true
                """,
                user_id
            )
            
            if user:
                return dict(user)
            return None
    
    @staticmethod
    async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        async with db.get_connection() as conn:
            user = await conn.fetchrow(
                """
                SELECT user_id, email, username, created_at, is_active 
                FROM users 
                WHERE email = $1 AND is_active = true
                """,
                email
            )
            
            if user:
                return dict(user)
            return None 