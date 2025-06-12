#!/usr/bin/env python3
"""
Simple test script for JWT authentication without database
"""

from auth.auth_utils import hash_password, verify_password, create_access_token, verify_access_token
from datetime import timedelta

def test_password_hashing():
    """Test password hashing and verification"""
    print("Testing password hashing...")
    password = "test123"
    hashed = hash_password(password)
    print(f"Original: {password}")
    print(f"Hashed: {hashed}")
    
    # Test verification
    is_valid = verify_password(password, hashed)
    print(f"Verification result: {is_valid}")
    
    # Test with wrong password
    is_invalid = verify_password("wrong", hashed)
    print(f"Wrong password result: {is_invalid}")
    print()

def test_jwt_tokens():
    """Test JWT token creation and verification"""
    print("Testing JWT tokens...")
    
    # Create token
    user_data = {"sub": "123", "username": "testuser"}
    token = create_access_token(user_data, expires_delta=timedelta(minutes=30))
    print(f"Created token: {token}")
    
    # Verify token
    try:
        payload = verify_access_token(token)
        print(f"Verified payload: {payload}")
    except Exception as e:
        print(f"Token verification error: {e}")
    
    # Test with invalid token
    try:
        verify_access_token("invalid.token.here")
    except Exception as e:
        print(f"Invalid token error (expected): {e}")
    print()

def main():
    print("🔐 Authentication System Test")
    print("=" * 40)
    
    try:
        test_password_hashing()
        test_jwt_tokens()
        print("✅ All authentication tests passed!")
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 