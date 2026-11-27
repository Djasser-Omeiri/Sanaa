import pytest
from django.urls import reverse

from apps.jobs.models import JobRequest

from .factories import UNKNOWN_TRADE_ID, make_image

pytestmark = pytest.mark.django_db


def login(api_client, auth):
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {auth.access}")


# ---- POST requests ----
def test_client_creates_request_with_photos(api_client, client_auth, request_data):
    login(api_client, client_auth)
    data = {**request_data, "photos": [make_image("a.png"), make_image("b.webp", "WEBP")]}
    response = api_client.post(reverse("request-create"), data, format="multipart")
    assert response.status_code == 201, response.data
    assert response.data["status"] == "open"
    assert response.data["general_area"] == "Bab Ezzouar"
    assert len(response.data["photos"]) == 2
    assert JobRequest.objects.get().client_user_id == client_auth.user.id


def test_client_creates_request_without_photos_as_json(api_client, client_auth, request_data):
    login(api_client, client_auth)
    response = api_client.post(reverse("request-create"), request_data, format="json")
    assert response.status_code == 201, response.data
    assert response.data["photos"] == []


def test_create_needs_login(api_client, request_data):
    response = api_client.post(reverse("request-create"), request_data, format="json")
    assert response.status_code == 401


def test_worker_cannot_create_request(api_client, worker_auth, request_data):
    login(api_client, worker_auth)
    response = api_client.post(reverse("request-create"), request_data, format="json")
    assert response.status_code == 403


def test_bad_input_gives_400(api_client, client_auth, request_data):
    login(api_client, client_auth)
    for field, bad_value in [("latitude", "95"), ("longitude", "-200"), ("description", "")]:
        response = api_client.post(
            reverse("request-create"), {**request_data, field: bad_value}, format="json"
        )
        assert response.status_code == 400, field
        assert field in response.data
    missing = {k: v for k, v in request_data.items() if k != "general_area"}
    assert api_client.post(reverse("request-create"), missing, format="json").status_code == 400


def test_unknown_trade_gives_404(api_client, client_auth, request_data):
    login(api_client, client_auth)
    response = api_client.post(
        reverse("request-create"), {**request_data, "trade_id": UNKNOWN_TRADE_ID}, format="json"
    )
    assert response.status_code == 404
    assert response.data == {"message": "Trade not found."}


def test_four_photos_give_400(api_client, client_auth, request_data):
    login(api_client, client_auth)
    data = {**request_data, "photos": [make_image(f"{i}.png") for i in range(4)]}
    response = api_client.post(reverse("request-create"), data, format="multipart")
    assert response.status_code == 400
    assert not JobRequest.objects.exists()


def test_photo_that_is_not_an_image_gives_400(api_client, client_auth, request_data):
    from django.core.files.uploadedfile import SimpleUploadedFile

    login(api_client, client_auth)
    fake = SimpleUploadedFile("virus.png", b"not an image", content_type="image/png")
    data = {**request_data, "photos": [fake]}
    response = api_client.post(reverse("request-create"), data, format="multipart")
    assert response.status_code == 400
    assert "photos" in response.data


def test_photo_in_a_refused_format_gives_400(api_client, client_auth, request_data):
    login(api_client, client_auth)
    data = {**request_data, "photos": [make_image("a.gif", "GIF")]}
    response = api_client.post(reverse("request-create"), data, format="multipart")
    assert response.status_code == 400


def test_photo_too_large_gives_400(api_client, client_auth, request_data, monkeypatch):
    from apps.jobs import apis

    monkeypatch.setattr(apis, "MAX_PHOTO_SIZE_MB", 0)  # any photo is now "too large"
    login(api_client, client_auth)
    data = {**request_data, "photos": [make_image()]}
    response = api_client.post(reverse("request-create"), data, format="multipart")
    assert response.status_code == 400


# ---- GET requests/mine ----
def test_my_requests_lists_only_my_requests(
    api_client, client_auth, other_client_auth, request_data
):
    login(api_client, client_auth)
    api_client.post(reverse("request-create"), request_data, format="json")
    api_client.post(reverse("request-create"), request_data, format="json")
    login(api_client, other_client_auth)
    api_client.post(reverse("request-create"), request_data, format="json")

    login(api_client, client_auth)
    response = api_client.get(reverse("request-mine"))
    assert response.status_code == 200
    assert response.data["count"] == 2
    assert all(r["status"] == "open" for r in response.data["results"])


def test_my_requests_is_paginated(api_client, client_auth, request_data):
    login(api_client, client_auth)
    for _ in range(3):
        api_client.post(reverse("request-create"), request_data, format="json")
    response = api_client.get(reverse("request-mine"), {"limit": 2})
    assert response.data["count"] == 3
    assert len(response.data["results"]) == 2
    assert response.data["next"] is not None


def test_worker_cannot_list_client_requests(api_client, worker_auth):
    login(api_client, worker_auth)
    assert api_client.get(reverse("request-mine")).status_code == 403
