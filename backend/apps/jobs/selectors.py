from django.db.models import QuerySet

from .models import JobRequest


def list_requests_for_client(*, client_user_id: int) -> QuerySet[JobRequest]:
    """The requests created by one client, newest first, with their photos (one extra query)."""
    return (
        JobRequest.objects.filter(client_user_id=client_user_id)
        .prefetch_related("photos")
        .order_by("-created_at", "-id")
    )
