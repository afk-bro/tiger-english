from typing import Optional

class AuthException(Exception):
    """Custom exception for authentication errors"""
    
    def __init__(self, message: str, field: Optional[str] = None):
        self.message = message
        self.field = field
        super().__init__(self.message)
