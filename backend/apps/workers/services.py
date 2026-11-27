from collections.abc import Iterable
from decimal import Decimal

from django.db import IntegrityError, transaction

from apps.accounts import selectors as account_selectors
from common.exceptions import ApplicationError, Conflict, Forbidden, NotFound

from . import selectors
from .models import WorkerProfile

WORKER_ROLE = "worker"
MIN_RADIUS_KM = 1


def _ensure_worker(*, user_id: int) -> None:
    if not account_selectors.user_has_role(user_id=user_id, role=WORKER_ROLE):
        raise Forbidden("Only workers can have a worker profile.")


def _validate_location(*, latitude: Decimal, longitude: Decimal) -> None:
    if not (Decimal("-90") <= latitude <= Decimal("90")):
        raise ApplicationError("Latitude must be between -90 and 90.")
    if not (Decimal("-180") <= longitude <= Decimal("180")):
        raise ApplicationError("Longitude must be between -180 and 180.")


def _validate_radius(*, radius_km: int) -> None:
    if radius_km < MIN_RADIUS_KM:
        raise ApplicationError(f"Search radius must be at least {MIN_RADIUS_KM} km.")


def _validate_trade_ids(*, trade_ids: Iterable[int]) -> tuple[int, ...]:
    ids = tuple(dict.fromkeys(trade_ids))
    if not ids:
        raise ApplicationError("Choose at least one trade.")
    missing = set(ids) - selectors.existing_trade_ids(trade_ids=ids)
    if missing:
        raise NotFound("Trade not found.")
    return ids


@transaction.atomic
def create_profile(
    *,
    user_id: int,
    base_latitude: Decimal,
    base_longitude: Decimal,
    trade_ids: Iterable[int],
    bio: str = "",
    search_radius_km: int = 10,
) -> WorkerProfile:
    _ensure_worker(user_id=user_id)
    if selectors.get_profile(user_id=user_id) is not None:
        raise Conflict("Worker profile already exists.")

    _validate_location(latitude=base_latitude, longitude=base_longitude)
    _validate_radius(radius_km=search_radius_km)
    valid_trade_ids = _validate_trade_ids(trade_ids=trade_ids)

    try:
        with transaction.atomic():
            profile = WorkerProfile.objects.create(
                user_id=user_id,
                bio=bio,
                base_latitude=base_latitude,
                base_longitude=base_longitude,
                search_radius_km=search_radius_km,
            )
    except IntegrityError:
        raise Conflict("Worker profile already exists.") from None

    profile.trades.set(valid_trade_ids)
    return profile


@transaction.atomic
def update_profile(
    *,
    user_id: int,
    bio: str | None = None,
    base_latitude: Decimal | None = None,
    base_longitude: Decimal | None = None,
    search_radius_km: int | None = None,
    trade_ids: Iterable[int] | None = None,
) -> WorkerProfile:
    _ensure_worker(user_id=user_id)
    profile = selectors.get_profile(user_id=user_id)
    if profile is None:
        raise NotFound("Worker profile not found.")

    fields = []
    latitude = profile.base_latitude if base_latitude is None else base_latitude
    longitude = profile.base_longitude if base_longitude is None else base_longitude
    if base_latitude is not None or base_longitude is not None:
        _validate_location(latitude=latitude, longitude=longitude)
        if base_latitude is not None:
            profile.base_latitude = base_latitude
            fields.append("base_latitude")
        if base_longitude is not None:
            profile.base_longitude = base_longitude
            fields.append("base_longitude")

    if bio is not None:
        profile.bio = bio
        fields.append("bio")

    if search_radius_km is not None:
        _validate_radius(radius_km=search_radius_km)
        profile.search_radius_km = search_radius_km
        fields.append("search_radius_km")

    if trade_ids is not None:
        profile.trades.set(_validate_trade_ids(trade_ids=trade_ids))

    if fields:
        fields.append("updated_at")
        profile.save(update_fields=fields)
    elif trade_ids is not None:
        profile.save(update_fields=["updated_at"])

    return profile
