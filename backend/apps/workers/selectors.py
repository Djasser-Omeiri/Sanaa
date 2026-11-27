from collections.abc import Iterable

from django.db.models import QuerySet

from .models import Trade, WorkerProfile


def list_trades() -> QuerySet[Trade]:
    return Trade.objects.all().order_by("name")


def existing_trade_ids(*, trade_ids: Iterable[int]) -> set[int]:
    ids = set(trade_ids)
    if not ids:
        return set()
    return set(Trade.objects.filter(id__in=ids).values_list("id", flat=True))


def get_profile(*, user_id: int) -> WorkerProfile | None:
    return WorkerProfile.objects.prefetch_related("trades").filter(user_id=user_id).first()
