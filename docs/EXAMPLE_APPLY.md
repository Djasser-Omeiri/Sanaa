# Example to copy: "a worker applies to a job request"

Every use case is written in the same files. Copy this one and change the names.
Call chain: `apis.py` -> `services.py` -> `models.py`, with `selectors.py` for reads.
This file is a reference only. Sami writes the real version in task C2.1.

## 1. Model and rules: `apps/jobs/models.py`

```python
from django.db import models

from common.models import BaseModel


class JobRequest(BaseModel):
    class Status(models.TextChoices):
        OPEN = "open"
        WORKER_CONFIRMED = "worker_confirmed"
        COMPLETED = "completed"

    client_user_id = models.PositiveBigIntegerField()  # plain id, no ForeignKey to accounts
    trade_id = models.PositiveBigIntegerField()  # plain id, trades live in workers
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)


class Application(BaseModel):
    request = models.ForeignKey(JobRequest, on_delete=models.CASCADE, related_name="applications")
    worker_user_id = models.PositiveBigIntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["request", "worker_user_id"], name="one_application_per_worker"
            )
        ]
```

A ForeignKey is allowed only inside one module (`Application` -> `JobRequest`, both in `jobs`).
Links to other modules are plain id fields.

## 2. Selector (reads): `apps/jobs/selectors.py`

```python
from .models import Application, JobRequest


def get_request(*, request_id: int, for_update: bool = False) -> JobRequest | None:
    queryset = JobRequest.objects.filter(id=request_id)
    if for_update:
        queryset = queryset.select_for_update()  # locks the row until the transaction ends
    return queryset.first()


def application_exists(*, request_id: int, worker_user_id: int) -> bool:
    return Application.objects.filter(request_id=request_id, worker_user_id=worker_user_id).exists()
```

## 3. Service (the use case): `apps/jobs/services.py`

Rules and the write live here. `select_for_update` only works inside a transaction.

```python
from django.db import transaction

from apps.workers import selectors as worker_selectors  # allowed: workers comes before jobs
from common.exceptions import Conflict, Forbidden, NotFound

from . import selectors
from .models import Application, JobRequest


@transaction.atomic
def apply_to_request(*, request_id: int, worker_user_id: int) -> Application:
    # for_update=True locks the request, so apply and confirm cannot run at the same time
    job_request = selectors.get_request(request_id=request_id, for_update=True)
    if job_request is None:
        raise NotFound("Job request not found.")
    if job_request.status != JobRequest.Status.OPEN:
        raise Conflict("This request is no longer open.")
    if not worker_selectors.can_apply_to_trade(
        user_id=worker_user_id, trade_id=job_request.trade_id
    ):
        raise Forbidden("Your profile does not include the trade of this request.")
    if selectors.application_exists(request_id=request_id, worker_user_id=worker_user_id):
        raise Conflict("You already applied to this request.")
    return Application.objects.create(request=job_request, worker_user_id=worker_user_id)
```

## 4. API (thin view) and route: `apps/jobs/apis.py`, `apps/jobs/urls.py`

```python
# apis.py
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import IsWorker

from . import services


class ApplyApi(APIView):
    permission_classes = [IsWorker]

    class OutputSerializer(serializers.Serializer):
        id = serializers.IntegerField()
        request_id = serializers.IntegerField()

    def post(self, request, request_id: int):
        application = services.apply_to_request(
            request_id=request_id, worker_user_id=request.user.id
        )
        return Response(self.OutputSerializer(application).data, status=status.HTTP_201_CREATED)
```

```python
# urls.py
from django.urls import path

from . import apis

urlpatterns = [
    path("requests/<int:request_id>/apply", apis.ApplyApi.as_view(), name="request-apply"),
]
```

The view never catches errors: the handler in `common/exception_handler.py` already turns
`NotFound`, `Conflict` and `Forbidden` into 404, 409 and 403.

## 5. Test: `apps/jobs/tests/test_services.py`

```python
import pytest

from apps.jobs import services
from apps.jobs.models import JobRequest
from common.exceptions import Conflict

pytestmark = pytest.mark.django_db


def test_cannot_apply_twice(open_request, approved_worker):
    services.apply_to_request(request_id=open_request.id, worker_user_id=approved_worker)
    with pytest.raises(Conflict):
        services.apply_to_request(request_id=open_request.id, worker_user_id=approved_worker)


def test_cannot_apply_to_a_closed_request(open_request, approved_worker):
    open_request.status = JobRequest.Status.WORKER_CONFIRMED
    open_request.save()
    with pytest.raises(Conflict):
        services.apply_to_request(request_id=open_request.id, worker_user_id=approved_worker)
```

`open_request` and `approved_worker` are small pytest fixtures that create test data.

## Checklist for a new use case

1. Model or constraint changed? Run `makemigrations`, commit the migration, never edit a merged one.
2. Reads go in `selectors.py`, rules and writes go in `services.py` (keyword-only arguments).
3. More than one row written, or a row locked? Use `@transaction.atomic`.
4. The view only reads input, calls one service, returns output.
5. Another module's data? Call its selector or service with ids, never import its models.
6. Add service tests and API tests, then run `pytest`, `ruff check .`, `black --check .`, `lint-imports`.
