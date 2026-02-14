from slowapi import Limiter
from slowapi.util import get_remote_address

# Define global limiter
_limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/hour"],  # global default
)
