from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import serializers, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from common.pagination import paginated_response
from common.permissions import IsClient

from . import selectors, services
from .models import JobRequest

MAX_PHOTO_SIZE_MB = 5  # proposal from the architecture document, to confirm with the supervisor
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}


def validate_photo(image):
    """Format checks for one uploaded photo. serializers.ImageField already checked (with
    Pillow) that the file is a real image; here we check its format and its size."""
    image_format = getattr(getattr(image, "image", None), "format", None)
    if image_format not in ALLOWED_IMAGE_FORMATS:
        raise serializers.ValidationError("Accepted photo formats: JPEG, PNG, WebP.")
    if image.size > MAX_PHOTO_SIZE_MB * 1024 * 1024:
        raise serializers.ValidationError(f"A photo must be at most {MAX_PHOTO_SIZE_MB} MB.")
    return image


class RequestPhotoOutputSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    image = serializers.ImageField()  # the URL of the photo

    class Meta:
        ref_name = "RequestPhoto"


class OwnRequestOutputSerializer(serializers.Serializer):
    """A request as its owner sees it: with the exact location (only the owner gets it)."""

    id = serializers.IntegerField()
    trade_id = serializers.IntegerField()
    description = serializers.CharField()
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    general_area = serializers.CharField()
    status = serializers.ChoiceField(choices=JobRequest.Status.choices)
    photos = RequestPhotoOutputSerializer(many=True)
    created_at = serializers.DateTimeField()

    class Meta:
        ref_name = "OwnJobRequest"


class OwnRequestPageSerializer(serializers.Serializer):
    """Only used to describe the paginated answer in the API docs."""

    count = serializers.IntegerField()
    next = serializers.URLField(allow_null=True)
    previous = serializers.URLField(allow_null=True)
    results = OwnRequestOutputSerializer(many=True)

    class Meta:
        ref_name = "OwnJobRequestPage"


class CreateRequestApi(APIView):
    """POST requests: a client publishes a job request (FP2)."""

    permission_classes = [IsClient]
    # multipart/form-data is needed to upload photos; JSON works when there are no photos
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    class InputSerializer(serializers.Serializer):
        trade_id = serializers.IntegerField(min_value=1)
        description = serializers.CharField(max_length=2000)
        latitude = serializers.DecimalField(
            max_digits=9, decimal_places=6, min_value=-90, max_value=90
        )
        longitude = serializers.DecimalField(
            max_digits=9, decimal_places=6, min_value=-180, max_value=180
        )
        general_area = serializers.CharField(max_length=120)
        photos = serializers.ListField(
            child=serializers.ImageField(validators=[validate_photo]),
            required=False,
            default=list,
        )

        class Meta:
            ref_name = "CreateJobRequestInput"

    @extend_schema(
        request={"multipart/form-data": InputSerializer, "application/json": InputSerializer},
        responses={201: OwnRequestOutputSerializer},
    )
    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)  # bad input -> 400 automatically
        job_request = services.create_request(
            client_user_id=request.user.id, **serializer.validated_data
        )
        return Response(
            OwnRequestOutputSerializer(job_request).data, status=status.HTTP_201_CREATED
        )


class MyRequestListApi(APIView):
    """GET requests/mine: the client's own requests, newest first, paginated (FP2)."""

    permission_classes = [IsClient]

    @extend_schema(
        parameters=[
            OpenApiParameter("limit", int, description="How many requests (default 20, max 100)"),
            OpenApiParameter("offset", int, description="How many requests to skip"),
        ],
        responses={200: OwnRequestPageSerializer},
    )
    def get(self, request):
        requests_ = selectors.list_requests_for_client(client_user_id=request.user.id)
        return paginated_response(
            request=request,
            view=self,
            queryset=requests_,
            serializer_class=OwnRequestOutputSerializer,
        )
