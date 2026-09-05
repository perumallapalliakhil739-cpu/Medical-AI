"""
Authentication endpoints: signup, login, me, logout.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import (
    UserSignupRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)
from app.core.deps import get_current_user

router = APIRouter()


@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register Clinician or Operator Account",
    description="Creates a new practitioner account with secure password hashing and returns an initial JWT authentication token."
)
def signup(payload: UserSignupRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Register new user."""
    # Check if email already registered
    existing_user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in."
        )

    # Hash password safely
    password_hash = hash_password(payload.password)

    new_user = User(
        email=payload.email.lower().strip(),
        hashed_password=password_hash,
        full_name=payload.name.strip(),
        role=payload.role,
        institution=payload.institution.strip() if payload.institution else None,
        license_number=payload.license_number.strip() if payload.license_number else None,
        account_status="active",
        is_active=True,
        is_verified=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate JWT token
    token = create_access_token(
        subject=new_user.id,
        extra_claims={
            "email": new_user.email,
            "role": new_user.role,
            "name": new_user.full_name
        }
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User Sign In",
    description="Authenticates clinician credentials and issues a signed JWT session token."
)
def login(payload: UserLoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Authenticate and return JWT token."""
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials."
        )

    if not user.is_active or user.account_status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact the clinical administrator."
        )

    token = create_access_token(
        subject=user.id,
        extra_claims={
            "email": user.email,
            "role": user.role,
            "name": user.full_name
        }
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current User Profile",
    description="Returns the profile of the currently authenticated practitioner."
)
def get_current_user_profile(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Retrieve logged-in user profile."""
    return UserResponse.model_validate(current_user)


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout Session",
    description="Acknowledges client session termination."
)
def logout(current_user: User = Depends(get_current_user)):
    """Confirm user logout."""
    return {
        "status": "ok",
        "message": f"Session closed for {current_user.email}."
    }
