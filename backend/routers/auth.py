"""
Authentication & Authorization API Routes (JWT + RBAC).
"""
from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

try:
    from database import get_db, UserDB
    from security import (
        hash_password, verify_password, create_access_token,
        get_current_user
    )
except ImportError:
    from backend.database import get_db, UserDB
    from backend.security import (
        hash_password, verify_password, create_access_token,
        get_current_user
    )

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    email: str
    password: str
    fullName: str
    role: str = "CITIZEN"  # "CITIZEN", "DRIVER", "DISPATCHER"
    phone: Optional[str] = None
    ambulanceId: Optional[int] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    fullName: str
    role: str
    phone: Optional[str] = None
    ambulanceId: Optional[int] = None


class AuthResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: UserResponse


@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(UserDB).filter(UserDB.email == req.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    new_user = UserDB(
        email=req.email.lower(),
        hashed_password=hash_password(req.password),
        full_name=req.fullName,
        role=req.role.upper(),
        phone=req.phone,
        ambulance_id=req.ambulanceId
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.email, "role": new_user.role, "id": new_user.id})
    return AuthResponse(
        accessToken=token,
        user=UserResponse(
            id=new_user.id,
            email=new_user.email,
            fullName=new_user.full_name,
            role=new_user.role,
            phone=new_user.phone,
            ambulanceId=new_user.ambulance_id
        )
    )


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_access_token({"sub": user.email, "role": user.role, "id": user.id})
    return AuthResponse(
        accessToken=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            fullName=user.full_name,
            role=user.role,
            phone=user.phone,
            ambulanceId=user.ambulance_id
        )
    )


@router.get("/me", response_model=UserResponse)
def get_profile(current_user: UserDB = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        fullName=current_user.full_name,
        role=current_user.role,
        phone=current_user.phone,
        ambulanceId=current_user.ambulance_id
    )
