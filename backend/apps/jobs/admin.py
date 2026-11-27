from django.contrib import admin

from .models import JobRequest, RequestPhoto


class RequestPhotoInline(admin.TabularInline):
    model = RequestPhoto
    extra = 0


@admin.register(JobRequest)
class JobRequestAdmin(admin.ModelAdmin):
    list_display = ["id", "client_user_id", "trade_id", "general_area", "status", "created_at"]
    list_filter = ["status"]
    inlines = [RequestPhotoInline]
