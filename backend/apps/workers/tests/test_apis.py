import pytest
from django.urls import reverse

from apps.accounts import services as account_services
from apps.workers.models import Trade

PASSWORD = "Str0ng-Pass-2026"

pytestmark = pytest.mark.django_db


def authenticate(api_client, *, role: str = "worker", phone: str = "0555000001"):
    result = account_services.register_user(
        full_name=f"{role.title()} User", password=PASSWORD, role=role, phone=phone
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {result.access}")
    return result.user


def profile_payload(**over):
    data = {
        "bio": "I repair pipes.",
        "base_latitude": "36.753800",
        "base_longitude": "3.058900",
        "search_radius_km": 15,
        "trade_ids": [Trade.objects.get(name="Plumber").id],
    }
    data.update(over)
    return data


def test_trades_requires_authentication(api_client):
    assert api_client.get(reverse("trades")).status_code == 401


def test_authenticated_user_can_list_trades(api_client):
    authenticate(api_client)
    response = api_client.get(reverse("trades"))
    assert response.status_code == 200
    assert {trade["name"] for trade in response.data} >= {"Plumber", "Electrician"}


def test_worker_can_create_read_and_update_profile(api_client):
    user = authenticate(api_client)
    url = reverse("worker-profile")

    created = api_client.post(url, profile_payload(), format="json")
    assert created.status_code == 201
    assert created.data["user_id"] == user.id
    assert created.data["search_radius_km"] == 15
    assert [trade["name"] for trade in created.data["trades"]] == ["Plumber"]

    fetched = api_client.get(url)
    assert fetched.status_code == 200
    assert fetched.data["bio"] == "I repair pipes."

    carpenter = Trade.objects.get(name="Carpenter")
    updated = api_client.patch(
        url,
        {"bio": "I build cabinets.", "trade_ids": [carpenter.id], "search_radius_km": 25},
        format="json",
    )
    assert updated.status_code == 200
    assert updated.data["bio"] == "I build cabinets."
    assert updated.data["search_radius_km"] == 25
    assert [trade["name"] for trade in updated.data["trades"]] == ["Carpenter"]


def test_client_cannot_create_profile(api_client):
    authenticate(api_client, role="client")
    response = api_client.post(reverse("worker-profile"), profile_payload(), format="json")
    assert response.status_code == 403


def test_duplicate_profile_is_409(api_client):
    authenticate(api_client)
    url = reverse("worker-profile")
    assert api_client.post(url, profile_payload(), format="json").status_code == 201
    assert api_client.post(url, profile_payload(), format="json").status_code == 409


def test_unknown_trade_is_404_and_bad_input_is_400(api_client):
    authenticate(api_client)
    url = reverse("worker-profile")
    assert (
        api_client.post(url, profile_payload(trade_ids=[999999]), format="json").status_code == 404
    )
    assert api_client.post(url, profile_payload(trade_ids=[]), format="json").status_code == 400
    assert (
        api_client.post(url, profile_payload(base_latitude="120.000000"), format="json").status_code
        == 400
    )


def test_worker_without_profile_gets_404(api_client):
    authenticate(api_client)
    assert api_client.get(reverse("worker-profile")).status_code == 404
