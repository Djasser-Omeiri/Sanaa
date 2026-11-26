from django.db import migrations

ROLES = ["client", "worker", "staff"]


def create_roles(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    for name in ROLES:
        Role.objects.get_or_create(name=name)


def delete_roles(apps, schema_editor):
    apps.get_model("accounts", "Role").objects.filter(name__in=ROLES).delete()


class Migration(migrations.Migration):
    dependencies = [("accounts", "0002_user_profile_and_roles")]

    operations = [migrations.RunPython(create_roles, delete_roles)]