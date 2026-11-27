from decimal import Decimal

from django.db import transaction

from apps.workers import selectors as worker_selectors  # allowed: workers comes before jobs
from common.exceptions import ApplicationError, NotFound

from .models import JobRequest, RequestPhoto

MAX_PHOTOS = 3  # a request has 0 to 3 photos (FP2)


@transaction.atomic  # the request and its photos are saved together, or not at all
def create_request(
    *,
    client_user_id: int,
    trade_id: int,
    description: str,
    latitude: Decimal,
    longitude: Decimal,
    general_area: str,
    photos=(),
) -> JobRequest:
    """A client publishes a job request (FP2). It starts with the status "open"."""
    if trade_id not in worker_selectors.existing_trade_ids(trade_ids=[trade_id]):
        raise NotFound("Trade not found.")
    if len(photos) > MAX_PHOTOS:
        raise ApplicationError(f"A request accepts at most {MAX_PHOTOS} photos.")

    job_request = JobRequest.objects.create(
        client_user_id=client_user_id,
        trade_id=trade_id,
        description=description.strip(),
        latitude=latitude,
        longitude=longitude,
        general_area=general_area.strip(),
        status=JobRequest.Status.OPEN,
    )
    for image in photos:
        RequestPhoto.objects.create(request=job_request, image=image)
    return job_request
