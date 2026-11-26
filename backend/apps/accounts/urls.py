from django.urls import path

from . import apis

urlpatterns = [
    path("auth/register", apis.RegisterApi.as_view(), name="auth-register"),
    path("auth/login", apis.LoginApi.as_view(), name="auth-login"),
    path("auth/refresh", apis.RefreshApi.as_view(), name="auth-refresh"),
    path("me", apis.MeApi.as_view(), name="me"),
]