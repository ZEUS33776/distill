import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    # Database settings
    PGHOST: str = os.getenv("PGHOST", "localhost")
    PGDATABASE: str = os.getenv("PGDATABASE")
    PGUSER: str = os.getenv("PGUSER")
    PGPASSWORD: str = os.getenv("PGPASSWORD")
    PGPORT: int = int(os.getenv("PGPORT", "5432"))
    
    # JWT settings
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    @property
    def database_url(self) -> str:
        return f"postgresql://{self.PGUSER}:{self.PGPASSWORD}@{self.PGHOST}:{self.PGPORT}/{self.PGDATABASE}"

settings = Settings() 