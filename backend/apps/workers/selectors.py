from collections.abc import Iterable
from decimal import Decimal
from typing import TypedDict

from django.db.models import QuerySet

from .models import Trade, WorkerProfile


class SearchArea(TypedDict):
    trade_ids: tuple[int, ...]
    latitude: Decimal
    longitude: Decimal
    radius_km: int


def list_trades() -> QuerySet[Trade]:
    return Trade.objects.all().order_by("name")


def existing_trade_ids(*, trade_ids: Iterable[int]) -> set[int]:
    ids = set(trade_ids)
    if not ids:
        return set()
    return set(Trade.objects.filter(id__in=ids).values_list("id", flat=True))


def get_profile(*, user_id: int) -> WorkerProfile | None:
    return WorkerProfile.objects.prefetch_related("trades").filter(user_id=user_id).first()


def can_apply_to_trade(*, user_id: int, trade_id: int) -> bool:
    return WorkerProfile.objects.filter(user_id=user_id, trades__id=trade_id).exists()


def get_search_area(*, user_id: int) -> SearchArea | None:
    profile = get_profile(user_id=user_id)
    if profile is None:
        return None
    return {
        "trade_ids": tuple(trade.id for trade in profile.trades.all()),
        "latitude": profile.base_latitude,
        "longitude": profile.base_longitude,
        "radius_km": profile.search_radius_km,
    }
