import pytest

from apps.jobs import selectors, services
from apps.jobs.models import JobRequest, RequestPhoto
from common.exceptions import ApplicationError, NotFound

from .factories import UNKNOWN_TRADE_ID, make_image

pytestmark = pytest.mark.django_db


def test_create_request_starts_open(client_auth, request_data):
    job_request = services.create_request(client_user_id=client_auth.user.id, **request_data)
    assert job_request.status == JobRequest.Status.OPEN
    assert job_request.client_user_id == client_auth.user.id
    assert job_request.photos.count() == 0


def test_create_request_with_photos(client_auth, request_data):
    photos = [make_image("a.png"), make_image("b.jpg", "JPEG")]
    job_request = services.create_request(
        client_user_id=client_auth.user.id, photos=photos, **request_data
    )
    assert job_request.photos.count() == 2
    # stored under a random name, not the original one
    assert all("a.png" not in p.image.name for p in job_request.photos.all())


def test_unknown_trade_is_refused(client_auth, request_data):
    request_data["trade_id"] = UNKNOWN_TRADE_ID
    with pytest.raises(NotFound):
        services.create_request(client_user_id=client_auth.user.id, **request_data)
    assert not JobRequest.objects.exists()


def test_more_than_three_photos_is_refused(client_auth, request_data):
    photos = [make_image(f"{i}.png") for i in range(4)]
    with pytest.raises(ApplicationError):
        services.create_request(client_user_id=client_auth.user.id, photos=photos, **request_data)
    assert not JobRequest.objects.exists()
    assert not RequestPhoto.objects.exists()


def test_list_requests_for_client_only_returns_own_newest_first(
    client_auth, other_client_auth, request_data
):
    first = services.create_request(client_user_id=client_auth.user.id, **request_data)
    second = services.create_request(client_user_id=client_auth.user.id, **request_data)
    services.create_request(client_user_id=other_client_auth.user.id, **request_data)

    mine = list(selectors.list_requests_for_client(client_user_id=client_auth.user.id))
    assert [r.id for r in mine] == [second.id, first.id]
