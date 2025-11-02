"""Application configuration."""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.settings.common import ENV_FILES


class AppSettings(BaseSettings):
    """
    Application settings - API configuration only.

    This branch focuses on API design without database integration.
    Database settings will be in a separate branch.
    """

    # API Settings
    api_prefix: str = Field(default="/api")
    api_version: str = Field(default="v1")

    # CORS Settings
    allowed_origins: list[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=ENV_FILES,
        env_ignore_empty=True,
        extra="ignore",
    )
