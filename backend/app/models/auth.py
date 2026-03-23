from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from ..core.languages import validate_native_language


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)
    first_name: str = Field(min_length=1, max_length=50)
    last_name: str = Field(min_length=1, max_length=50)
    username: str = Field(min_length=3, max_length=30)
    native_language: Optional[str] = None

    @field_validator('native_language')
    @classmethod
    def check_language(cls, v: Optional[str]) -> Optional[str]:
        return validate_native_language(v)


class UpdateProfile(BaseModel):
    native_language: Optional[str] = None

    @field_validator('native_language')
    @classmethod
    def check_language(cls, v: Optional[str]) -> Optional[str]:
        return validate_native_language(v)


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
