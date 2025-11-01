from functools import lru_cache

from app.settings.app_settings import AppSettings


@lru_cache(maxsize=1)
def get_app_settings() -> AppSettings:
    return AppSettings()
