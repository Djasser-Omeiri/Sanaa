from pathlib import Path
from uuid import uuid4

from django.db import models

from common.models import BaseModel


class JobRequest(BaseModel):
    """A job that a client publishes (FP2). Example: "my kitchen tap is leaking"."""

    class Status(models.TextChoices):
        OPEN = "open"  # workers can see it and apply
        WORKER_CONFIRMED = "worker_confirmed"  # the client chose a worker (task C3.1)
        COMPLETED = "completed"  # the job is done (task C3.3)

    # Links to other modules are plain ids, never ForeignKeys (architecture rule 4).
    client_user_id = models.PositiveBigIntegerField()  # the User (accounts) who created it
    trade_id = models.PositiveBigIntegerField()  # the Trade (workers), e.g. plumber

    description = models.TextField(max_length=2000)
    # Exact location: only the owner client ever sees it (FC2).
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    # What workers and the public see instead of the exact location, e.g. "Bab Ezzouar".
    general_area = models.CharField(max_length=120)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]  # newest first
        indexes = [
            # GET requests/mine: a client's own requests
            models.Index(fields=["client_user_id", "-created_at"], name="jobreq_client_idx"),
            # GET requests/nearby (task C2.2): open requests of a trade in a latitude range
            models.Index(fields=["status", "trade_id", "latitude"], name="jobreq_nearby_idx"),
        ]

    def __str__(self) -> str:
        return f"Request {self.pk} ({self.status})"


ALLOWED_PHOTO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
DEFAULT_PHOTO_EXTENSION = ".jpg"


def request_photo_path(instance: "RequestPhoto", filename: str) -> str:
    """Store each photo under a random name, so a file name cannot be guessed.

    The extension of the uploaded name is kept only when it is an image extension we
    accept; anything else (".exe", ".php", no extension...) becomes ".jpg".
    """
    extension = Path(filename).suffix.lower()
    if extension not in ALLOWED_PHOTO_EXTENSIONS:
        extension = DEFAULT_PHOTO_EXTENSION
    return f"requests/{uuid4().hex}{extension}"


class RequestPhoto(BaseModel):
    """A photo of a job request. A request has 0 to 3 photos (rule checked in services.py)."""

    # A ForeignKey is fine here: JobRequest and RequestPhoto are both in the jobs module.
    request = models.ForeignKey(JobRequest, on_delete=models.CASCADE, related_name="photos")
    image = models.ImageField(upload_to=request_photo_path)

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return f"Photo {self.pk} of request {self.request_id}"
