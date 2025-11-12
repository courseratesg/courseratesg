"""RDS database settings configuration."""

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.settings.common import ENV_FILES


class RDSSettings(BaseSettings):
    """RDS database configuration settings."""

    db_host: str = Field(..., description="Database host")
    db_port: int = Field(default=5432, description="Database port")
    db_name: str = Field(..., description="Database name")
    db_username: str = Field(..., description="Database username")
    db_password: str = Field(..., description="Database password")

    # Connection pool settings
    pool_size: int = Field(default=5, description="Database connection pool size")
    pool_max_overflow: int = Field(default=10, description="Maximum overflow connections")
    pool_timeout: int = Field(default=30, description="Pool connection timeout in seconds")
    pool_recycle: int = Field(default=3600, description="Connection recycle time in seconds")

    @field_validator("db_port")
    @classmethod
    def validate_port(cls, v: int) -> int:
        """Validate database port is in valid range."""
        if not 1 <= v <= 65535:
            raise ValueError("Port must be between 1 and 65535")
        return v

    @property
    def database_url(self) -> str:
        """Generate PostgreSQL database URL."""
        return f"postgresql://{self.db_username}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    model_config = SettingsConfigDict(
        env_file=ENV_FILES,
        env_ignore_empty=True,
        extra="ignore",
    )
