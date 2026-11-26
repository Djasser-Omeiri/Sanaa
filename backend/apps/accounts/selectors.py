from common.exceptions import NotFound

from .identifiers import normalize_email, normalize_phone
from .models import User


def get_user(*, user_id: int) -> User:
    try:
        return User.objects.prefetch_related("roles").get(id=user_id)
    except User.DoesNotExist:
        raise NotFound("User not found.") from None


def get_user_by_identifier(*, identifier: str) -> User | None:
    """Find a user by phone number or email. Returns None when nobody matches."""
    identifier = identifier.strip()
    if "@" in identifier:
        lookup = {"email": normalize_email(identifier)}
    else:
        lookup = {"phone": normalize_phone(identifier)}
    return User.objects.prefetch_related("roles").filter(**lookup).first()


def user_has_role(*, user_id: int, role: str) -> bool:
    return User.objects.filter(id=user_id, roles__name=role).exists()


def identifier_is_taken(*, phone: str | None, email: str | None) -> bool:
    """True when this phone number or this email already belongs to an account."""
    if phone and User.objects.filter(phone=normalize_phone(phone)).exists():
        return True
    return bool(email and User.objects.filter(email=normalize_email(email)).exists())