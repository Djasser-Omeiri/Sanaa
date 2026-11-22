from django.db import models


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Moderated(BaseModel):  # used by PortfolioPost
    class ModerationStatus(models.TextChoices):
        PENDING = "pending"
        APPROVED = "approved"
        REJECTED = "rejected"

    moderation_status = models.CharField(
        max_length=20, choices=ModerationStatus.choices, default=ModerationStatus.PENDING
    )
    rejection_reason = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by_user_id = models.PositiveBigIntegerField(
        null=True, blank=True
    )  # the staff user (id from accounts)

    class Meta:
        abstract = True
