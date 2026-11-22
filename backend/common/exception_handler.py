from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from .exceptions import ApplicationError


def exception_handler(exc, context):
    if isinstance(exc, ApplicationError):
        return Response({"message": exc.message}, status=exc.status_code)
    return drf_exception_handler(exc, context)  # DRF's default for everything else
