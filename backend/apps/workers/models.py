from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from common.models import BaseModel


class Trade(BaseModel):
    name = models.CharField(max_length=50, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class WorkerProfile(BaseModel):
    user_id = models.PositiveBigIntegerField(unique=True)
    bio = models.TextField(blank=True, default="")
    base_latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[MinValueValidator(Decimal("-90")), MaxValueValidator(Decimal("90"))],
    )
    base_longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[MinValueValidator(Decimal("-180")), MaxValueValidator(Decimal("180"))],
    )
    search_radius_km = models.PositiveIntegerField(default=10, validators=[MinValueValidator(1)])
    trades = models.ManyToManyField(Trade, related_name="worker_profiles")

    def __str__(self) -> str:
        return f"worker {self.user_id}"
