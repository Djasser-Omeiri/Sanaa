from decimal import Decimal

import pytest

from apps.accounts import services as account_services
from apps.workers import services
from apps.workers.models import Trade
from common.exceptions import ApplicationError, Conflict, Forbidden, NotFound

PASSWORD = "Str0ng-Pass-2026"

pytestmark = pytest.mark.django_db


def make_user(*, role: str = "worker", phone: str = "0555000001"):
    return account_services.register_user(
        full_name=f"{role.title()} User", password=PASSWORD, role=role, phone=phone
    ).user


def create_profile_for(user, **over):
    data = {
        "bio": "I repair pipes.",
        "base_latitude": Decimal("36.753800"),
        "base_longitude": Decimal("3.058900"),
        "search_radius_km": 15,
        "trade_ids": [Trade.objects.get(name="Plumber").id],
    }
    data.update(over)
    return services.create_profile(user_id=user.id, **data)


def test_default_trades_are_created():
    assert set(Trade.objects.values_list("name", flat=True)) >= {
        "Carpenter",
        "Electrician",
        "Mason",
        "Painter",
        "Plumber",
    }


def test_create_profile():
    worker = make_user()
    profile = create_profile_for(worker)

    assert profile.user_id == worker.id
    assert profile.bio == "I repair pipes."
    assert profile.base_latitude == Decimal("36.753800")
    assert profile.base_longitude == Decimal("3.058900")
    assert profile.search_radius_km == 15
    assert list(profile.trades.values_list("name", flat=True)) == ["Plumber"]


def test_cannot_create_two_profiles():
    worker = make_user()
    create_profile_for(worker)
    with pytest.raises(Conflict):
        create_profile_for(worker)


def test_client_cannot_create_worker_profile():
    client = make_user(role="client")
    with pytest.raises(Forbidden):
        create_profile_for(client)


def test_cannot_create_profile_with_unknown_trade():
    worker = make_user()
    with pytest.raises(NotFound):
        create_profile_for(worker, trade_ids=[999999])


def test_cannot_create_profile_without_a_trade():
    worker = make_user()
    with pytest.raises(ApplicationError):
        create_profile_for(worker, trade_ids=[])


def test_update_profile_changes_fields_and_trades():
    worker = make_user()
    profile = create_profile_for(worker)
    carpenter = Trade.objects.get(name="Carpenter")

    updated = services.update_profile(
        user_id=worker.id,
        bio="Now I build cabinets.",
        base_latitude=Decimal("36.750000"),
        search_radius_km=25,
        trade_ids=[carpenter.id],
    )

    assert updated.bio == "Now I build cabinets."
    assert updated.base_latitude == Decimal("36.750000")
    assert updated.base_longitude == profile.base_longitude
    assert updated.search_radius_km == 25
    assert list(updated.trades.values_list("name", flat=True)) == ["Carpenter"]


def test_update_requires_an_existing_profile():
    worker = make_user()
    with pytest.raises(NotFound):
        services.update_profile(user_id=worker.id, bio="Nothing to update.")
