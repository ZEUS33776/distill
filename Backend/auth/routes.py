from fastapi import APIRouter, HTTPException, status, Depends
from auth.models import UserSignup, UserLogin, UserResponse, Token
from auth.user_db import UserDB
from auth.auth_utils import create_access_token
from auth.dependencies import get_current_active_user

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/signup", response_model=dict)
async def signup(user_data: UserSignup):
    """Register a new user"""
    try:
        # Create user in database
        user = await UserDB.create_user(
            email=user_data.email,
            username=user_data.username,
            password=user_data.password
        )
        
        # Create access token
        access_token = create_access_token(data={"sub": str(user["user_id"])})
        
        return {
            "message": "User created successfully",
            "user": {
                "user_id": str(user["user_id"]),
                "email": user["email"],
                "username": user["username"],
                "created_at": user["created_at"],
                "is_active": user["is_active"]
            },
            "access_token": access_token,
            "token_type": "bearer"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )

@router.post("/login", response_model=dict)
async def login(user_credentials: UserLogin):
    """Authenticate user and return access token"""
    user = await UserDB.authenticate_user(
        email=user_credentials.email,
        password=user_credentials.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user["user_id"])})
    
    return {
        "message": "Login successful",
        "user": user,
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_active_user)):
    """Get current user information"""
    return UserResponse(
        user_id=str(current_user["user_id"]),
        email=current_user["email"],
        username=current_user["username"],
        created_at=current_user["created_at"],
        is_active=current_user["is_active"]
    )

@router.post("/logout")
async def logout():
    """Logout user (client should delete token)"""
    return {"message": "Logout successful."} 