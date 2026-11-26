from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models

from common.models import BaseModel

from .identifiers import normalize_email, normalize_phone


class RoleName:
    """The roles of the Cahier. More can be added later as rows in the Role table."""

    CLIENT = "client"
    WORKER = "worker"
    STAFF = "staff"

    # The roles a person may choose at registration. Staff is never public (UC-AUTH-01).
    PUBLIC = (CLIENT, WORKER)


class Role(BaseModel):
    name = models.CharField(max_length=30, unique=True)

    def __str__(self) -> str:
        return self.name


class UserManager(BaseUserManager):
    def get_by_natural_key(self, identifier: str):
        """Used by Django (admin login, createsuperuser): an email OR a phone number."""
        identifier = identifier.strip()
        if "@" in identifier:
            return self.get(email=normalize_email(identifier))
        return self.get(phone=normalize_phone(identifier))

    def create_user(
        self, *, full_name, password, phone=None, email=None, language="fr", **extra_fields
    ):
        if not phone and not email:
            raise ValueError("A user needs a phone number or an email address.")
        user = self.model(
            full_name=full_name,
            phone=normalize_phone(phone) if phone else None,
            email=normalize_email(email) if email else None,
            language=language,
            **extra_fields,
        )
        user.set_password(password)  # hashed with Django's default hasher
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        """Used by `manage.py createsuperuser` (USERNAME_FIELD is the email)."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email=email, full_name=full_name, password=password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    class Language(models.TextChoices):
        ARABIC = "ar"
        FRENCH = "fr"
        ENGLISH = "en"

    full_name = models.CharField(max_length=150)
    # A person registers with a phone number or an email (or both). Each one is unique
    # when present; NULL (not an empty string) means "not given".
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    language = models.CharField(max_length=2, choices=Language.choices, default=Language.FRENCH)
    roles = models.ManyToManyField(Role, related_name="users", blank=True)

    is_active = models.BooleanField(default=True)
    # is_staff only opens the Django admin site. It is not the SANAA "staff" role.
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(phone__isnull=False) | models.Q(email__isnull=False),
                name="user_has_phone_or_email",
            )
        ]

    def __str__(self) -> str:
        return self.full_name or self.email or self.phone or f"user {self.pk}"