from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    pass  # full_name, phone, language, roles are added in task A1.1
