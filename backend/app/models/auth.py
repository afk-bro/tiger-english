import re
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from zoneinfo import available_timezones
from ..core.languages import validate_native_language


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    first_name: str = Field(min_length=1, max_length=50)
    last_name: str = Field(min_length=1, max_length=50)
    username: str = Field(min_length=3, max_length=30)
    native_language: Optional[str] = None

    @field_validator('password')
    @classmethod
    def password_complexity(cls, v: str) -> str:
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[!@#$%^&*]', v):
            raise ValueError('Password must contain at least one special character (!@#$%^&*)')
        return v

    @field_validator('native_language')
    @classmethod
    def check_language(cls, v: Optional[str]) -> Optional[str]:
        return validate_native_language(v)


VALID_CEFR_LEVELS = {"A1", "A2", "B1", "B1+", "B2", "C1"}


class UpdateProfile(BaseModel):
    native_language: Optional[str] = None
    timezone: Optional[str] = None
    target_cefr_level: Optional[str] = None

    @field_validator('native_language')
    @classmethod
    def check_language(cls, v: Optional[str]) -> Optional[str]:
        return validate_native_language(v)

    @field_validator('timezone')
    @classmethod
    def check_timezone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if v not in available_timezones():
            raise ValueError(f"Invalid IANA timezone: {v}")
        return v

    @field_validator('target_cefr_level')
    @classmethod
    def check_cefr_level(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if v not in VALID_CEFR_LEVELS:
            raise ValueError(f"Invalid CEFR level: {v}. Must be one of {sorted(VALID_CEFR_LEVELS)}")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    first_name: str
    last_name: str
    native_language: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    success: bool
    message: str
    field: Optional[str] = None


class UsernameCheckResponse(BaseModel):
    available: bool


class ProfileResponse(BaseModel):
    id: str
    username: str
    first_name: str
    last_name: str
    native_language: Optional[str] = None
