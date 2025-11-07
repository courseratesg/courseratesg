from functools import lru_cache

from app.settings.app_settings import AppSettings
from app.settings.rds_settings import RDSSettings


@lru_cache(maxsize=1)
def get_app_settings() -> AppSettings:
    return AppSettings()


@lru_cache(maxsize=1)
def get_rds_settings() -> RDSSettings:
    return RDSSettings()  # type: ignore[call-arg]
