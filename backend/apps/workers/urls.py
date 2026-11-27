from django.urls import path

from . import apis

urlpatterns = [
    path("trades", apis.TradesApi.as_view(), name="trades"),
    path("workers/me/profile", apis.WorkerProfileApi.as_view(), name="worker-profile"),
]
