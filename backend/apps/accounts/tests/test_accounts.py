import pytest
from django.urls import reverse
from rest_framework_simplejwt.tokens import AccessToken

from apps.accounts import selectors, services
from apps.accounts.exceptions import InvalidCredentials
from apps.accounts.models import Role, User
from common.exceptions import Conflict, Forbidden, NotFound

PASSWORD = "Str0ng-Pass-2026"

pytestmark = pytest.mark.django_db


def payload(**over):
    data = {
        "full_name": "Amine Benali",
        "phone": "0555 12 34 56",
        "password": PASSWORD,
        "role": "client",
    }
    data.update(over)
    return data


def register(client, **over):
    return client.post(reverse("auth-register"), payload(**over), format="json")


def test_roles_exist_from_migration():
    assert set(Role.objects.values_list("name", flat=True)) >= {"client", "worker", "staff"}


# ---- register ----
def test_register_client_returns_tokens_and_hashed_password(api_client):
    r = register(api_client)
    assert r.status_code == 201
    assert r.data["user"]["roles"] == ["client"]
    assert r.data["user"]["phone"] == "0555123456"
    assert r.data["user"]["language"] == "fr"
    user = User.objects.get(id=r.data["user"]["id"])
    assert user.password != PASSWORD and user.check_password(PASSWORD)
    assert AccessToken(r.data["access"])["roles"] == ["client"]


def test_register_worker_with_email(api_client):
    r = register(api_client, phone="", email="Worker@Mail.com", role="worker", language="ar")
    assert r.status_code == 201
    assert r.data["user"]["email"] == "worker@mail.com"
    assert r.data["user"]["roles"] == ["worker"]
    assert AccessToken(r.data["access"])["roles"] == ["worker"]


def test_register_staff_is_refused(api_client):
    r = register(api_client, role="staff")
    assert r.status_code == 400
    assert not User.objects.exists()


def test_register_needs_phone_or_email(api_client):
    r = register(api_client, phone="")
    assert r.status_code == 400


def test_register_rejects_bad_phone_and_weak_password(api_client):
    assert register(api_client, phone="abc").status_code == 400
    r = register(api_client, password="12345678")
    assert r.status_code == 400 and "password" in r.data


def test_register_duplicate_identifier_is_409(api_client):
    assert register(api_client).status_code == 201
    r = register(api_client, phone="0555-12-34-56")
    assert r.status_code == 409


def test_service_refuses_staff_role():
    with pytest.raises(Forbidden):
        services.register_user(full_name="X", password=PASSWORD, role="staff", phone="0555000000")


def test_service_duplicate_email_conflict():
    services.register_user(full_name="X", password=PASSWORD, role="client", email="a@b.com")
    with pytest.raises(Conflict):
        services.register_user(full_name="Y", password=PASSWORD, role="worker", email="A@B.com")


# ---- login ----
def test_login_by_phone_and_by_email(api_client):
    register(api_client, email="a@b.com")
    for identifier in ("0555 12 34 56", "A@B.com"):
        r = api_client.post(
            reverse("auth-login"), {"identifier": identifier, "password": PASSWORD}, format="json"
        )
        assert r.status_code == 200
        assert AccessToken(r.data["access"])["roles"] == ["client"]


def test_wrong_password_and_unknown_user_give_same_401(api_client):
    register(api_client)
    url = reverse("auth-login")
    a = api_client.post(url, {"identifier": "0555123456", "password": "nope"}, format="json")
    b = api_client.post(url, {"identifier": "0666000000", "password": "nope"}, format="json")
    assert a.status_code == b.status_code == 401
    assert a.data == b.data


def test_inactive_user_cannot_login():
    services.register_user(full_name="X", password=PASSWORD, role="client", phone="0555000000")
    User.objects.update(is_active=False)
    with pytest.raises(InvalidCredentials):
        services.login_user(identifier="0555000000", password=PASSWORD)


# ---- refresh ----
def test_refresh_keeps_roles(api_client):
    r = register(api_client, role="worker")
    r2 = api_client.post(reverse("auth-refresh"), {"refresh": r.data["refresh"]}, format="json")
    assert r2.status_code == 200
    assert AccessToken(r2.data["access"])["roles"] == ["worker"]


# ---- me ----
def test_me_requires_authentication(api_client):
    assert api_client.get(reverse("me")).status_code == 401


def test_me_get_and_patch(api_client):
    r = register(api_client)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
    assert api_client.get(reverse("me")).data["full_name"] == "Amine Benali"
    p = api_client.patch(reverse("me"), {"full_name": " Karim ", "language": "en"}, format="json")
    assert p.status_code == 200
    assert p.data["full_name"] == "Karim" and p.data["language"] == "en"
    assert api_client.patch(reverse("me"), {"language": "xx"}, format="json").status_code == 400


# ---- selectors ----
def test_selectors():
    res = services.register_user(full_name="X", password=PASSWORD, role="worker", phone="0555000000")
    uid = res.user.id
    assert selectors.get_user(user_id=uid).id == uid
    assert selectors.user_has_role(user_id=uid, role="worker")
    assert not selectors.user_has_role(user_id=uid, role="client")
    with pytest.raises(NotFound):
        selectors.get_user(user_id=999999)
    assert selectors.get_user_by_identifier(identifier="nobody@x.com") is None


# ---- admin ----
def test_admin_can_create_staff_user(client):
    User.objects.create_superuser(email="root@x.com", full_name="Root", password=PASSWORD)
    client.login(username="root@x.com", password=PASSWORD)
    staff_role = Role.objects.get(name="staff")
    r = client.post(
        "/admin/accounts/user/add/",
        {
            "full_name": "Moderator",
            "email": "mod@x.com",
            "phone": "",
            "new_password": PASSWORD,
            "language": "fr",
            "roles": [staff_role.id],
            "is_active": "on",
        },
    )
    assert r.status_code == 302, getattr(r, "context", None) and r.context["adminform"].form.errors
    mod = User.objects.get(email="mod@x.com")
    assert mod.check_password(PASSWORD) and selectors.user_has_role(user_id=mod.id, role="staff")