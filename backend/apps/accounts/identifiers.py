import re

_PHONE_NOISE = re.compile(r"[\s\-.()]")
_PHONE_PATTERN = re.compile(r"^\+?[0-9]{8,15}$")


def normalize_email(value: str) -> str:
    return value.strip().lower()


def normalize_phone(value: str) -> str:
    return _PHONE_NOISE.sub("", value.strip())


def is_valid_phone(value: str) -> bool:
    """value must already be normalized: optional leading +, then 8 to 15 digits."""
    return bool(_PHONE_PATTERN.match(value))