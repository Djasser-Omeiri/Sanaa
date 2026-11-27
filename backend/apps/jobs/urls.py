from django.urls import path

from . import apis

urlpatterns = [
    path("requests", apis.CreateRequestApi.as_view(), name="request-create"),
    path("requests/mine", apis.MyRequestListApi.as_view(), name="request-mine"),
]
