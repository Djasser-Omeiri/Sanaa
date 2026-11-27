from drf_spectacular.utils import extend_schema
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from common.exceptions import NotFound
from common.permissions import IsWorker

from . import selectors, services
from .models import Trade, WorkerProfile


class TradeOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trade
        fields = ["id", "name"]
        ref_name = "Trade"


class WorkerProfileOutputSerializer(serializers.ModelSerializer):
    trades = TradeOutputSerializer(many=True, read_only=True)

    class Meta:
        model = WorkerProfile
        fields = [
            "id",
            "user_id",
            "bio",
            "base_latitude",
            "base_longitude",
            "search_radius_km",
            "trades",
            "created_at",
            "updated_at",
        ]
        ref_name = "WorkerProfile"


class ProfileCreateSerializer(serializers.Serializer):
    bio = serializers.CharField(required=False, allow_blank=True, default="")
    base_latitude = serializers.DecimalField(
        max_digits=9, decimal_places=6, min_value=-90, max_value=90
    )
    base_longitude = serializers.DecimalField(
        max_digits=9, decimal_places=6, min_value=-180, max_value=180
    )
    search_radius_km = serializers.IntegerField(min_value=1)
    trade_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1), allow_empty=False
    )

    class Meta:
        ref_name = "WorkerProfileCreateInput"


class ProfileUpdateSerializer(serializers.Serializer):
    bio = serializers.CharField(required=False, allow_blank=True)
    base_latitude = serializers.DecimalField(
        max_digits=9, decimal_places=6, min_value=-90, max_value=90, required=False
    )
    base_longitude = serializers.DecimalField(
        max_digits=9, decimal_places=6, min_value=-180, max_value=180, required=False
    )
    search_radius_km = serializers.IntegerField(min_value=1, required=False)
    trade_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1), allow_empty=False, required=False
    )

    class Meta:
        ref_name = "WorkerProfileUpdateInput"


class TradesApi(APIView):
    @extend_schema(responses={200: TradeOutputSerializer(many=True)})
    def get(self, request):
        trades = selectors.list_trades()
        return Response(TradeOutputSerializer(trades, many=True).data)


class WorkerProfileApi(APIView):
    permission_classes = [IsWorker]

    @extend_schema(request=ProfileCreateSerializer, responses={201: WorkerProfileOutputSerializer})
    def post(self, request):
        serializer = ProfileCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = services.create_profile(user_id=request.user.id, **serializer.validated_data)
        return Response(WorkerProfileOutputSerializer(profile).data, status=status.HTTP_201_CREATED)

    @extend_schema(responses={200: WorkerProfileOutputSerializer})
    def get(self, request):
        profile = selectors.get_profile(user_id=request.user.id)
        if profile is None:
            raise NotFound("Worker profile not found.")
        return Response(WorkerProfileOutputSerializer(profile).data)

    @extend_schema(request=ProfileUpdateSerializer, responses={200: WorkerProfileOutputSerializer})
    def patch(self, request):
        serializer = ProfileUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = services.update_profile(user_id=request.user.id, **serializer.validated_data)
        return Response(WorkerProfileOutputSerializer(profile).data)
