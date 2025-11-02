from functools import lru_cache

from app.storage.review_storage import ReviewStorage


@lru_cache(maxsize=1)
def get_review_storage() -> ReviewStorage:
    return ReviewStorage()
