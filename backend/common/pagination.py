from rest_framework.pagination import LimitOffsetPagination


class DefaultPagination(LimitOffsetPagination):
    default_limit = 20
    max_limit = 100


def paginated_response(*, request, view, queryset, serializer_class):
    # queryset may be a QuerySet or a plain list (for example a list sorted by distance)
    paginator = DefaultPagination()
    page = paginator.paginate_queryset(queryset, request, view=view)
    return paginator.get_paginated_response(serializer_class(page, many=True).data)
