import os
from functools import lru_cache

from supabase import Client, create_client


@lru_cache(maxsize=1)
def get_supabase() -> Client | None:
    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_SERVICE_KEY", "").strip()

    if not url or not key:
        return None

    return create_client(url, key)


def is_db_enabled() -> bool:
    return get_supabase() is not None
