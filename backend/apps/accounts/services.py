from dataclasses import dataclass

from django.contrib.auth.hashers import make_password
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from common.exceptions import Conflict, Forbidden

from . import selectors
from .exceptions import InvalidCredentials
from .identifiers import normalize_email, normalize_phone
from .models import Role, RoleName, User


@dataclass(frozen=True)
class AuthResult:
    user: User
    access: str
    refresh: str


def issue_tokens(*, user: User) -> tuple[str, str]:
    """Return (access, refresh). The roles are stored in the database and carried in the JWT.

    The claim is set on the refresh token, and the access tokens made from it copy it,
    so a refreshed access token still carries the roles. A role change only reaches the
    token at the next login.
    """
    refresh = RefreshToken.for_user(user)
    refresh["roles"] = sorted(role.name for role in user.roles.all())
    return str(refresh.access_token), str(refresh)


@transaction.atomic
def register_user(
    *,
    full_name: str,
    password: str,
    role: str,
    phone: str | None = None,
    email: str | None = None,
    language: str = User.Language.FRENCH,
) -> AuthResult:
    """Create an account as a client or a worker and open a session.

    Staff accounts are never created here: they are created in the Django admin.
    """
    if role not in RoleName.PUBLIC:
        raise Forbidden("This role cannot be chosen at registration.")
    phone = normalize_phone(phone) if phone else None
    email = normalize_email(email) if email else None
    if not phone and not email:
        raise Conflict("Give a phone number or an email address.")
    if selectors.identifier_is_taken(phone=phone, email=email):
        raise Conflict("This phone number or email is already used.")

    try:
        with transaction.atomic():  # a savepoint, so a duplicate does not break the outer one
            user = User.objects.create_user(
                full_name=full_name.strip(),
                password=password,
                phone=phone,
                email=email,
                language=language,
            )
    except IntegrityError:  # two registrations with the same identifier at the same moment
        raise Conflict("This phone number or email is already used.") from None

    user.roles.add(Role.objects.get(name=role))
    access, refresh = issue_tokens(user=user)
    return AuthResult(user=user, access=access, refresh=refresh)


def login_user(*, identifier: str, password: str) -> AuthResult:
    """Check the credentials and issue a JWT. A wrong identifier and a wrong password give
    the same error, so nobody learns which accounts exist (UC-AUTH-01, scenario C)."""
    user = selectors.get_user_by_identifier(identifier=identifier)
    if user is None:
        make_password(password)  # spend the same time as a real check
        raise InvalidCredentials()
    if not user.check_password(password) or not user.is_active:
        raise InvalidCredentials()

    user.last_login = timezone.now()
    user.save(update_fields=["last_login"])
    access, refresh = issue_tokens(user=user)
    return AuthResult(user=user, access=access, refresh=refresh)


def update_me(*, user_id: int, full_name: str | None = None, language: str | None = None) -> User:
    """Change the name and/or the interface language of the connected user (FC3)."""
    user = selectors.get_user(user_id=user_id)
    fields = []
    if full_name is not None:
        user.full_name = full_name.strip()
        fields.append("full_name")
    if language is not None:
        user.language = language
        fields.append("language")
    if fields:
        user.save(update_fields=[*fields, "updated_at"])
    return user