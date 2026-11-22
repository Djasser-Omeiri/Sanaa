from rest_framework.permissions import BasePermission


def _has_role(request, role: str) -> bool:
    token = request.auth  # the validated JWT; A1.1 adds the claim "roles": ["client", ...]
    return bool(
        request.user and request.user.is_authenticated and token and role in token.get("roles", [])
    )


class IsClient(BasePermission):
    def has_permission(self, request, view):
        return _has_role(request, "client")


class IsWorker(BasePermission):
    def has_permission(self, request, view):
        return _has_role(request, "worker")


class IsStaff(BasePermission):
    def has_permission(self, request, view):
        return _has_role(request, "staff")
