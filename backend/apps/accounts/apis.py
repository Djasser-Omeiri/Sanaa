from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from drf_spectacular.utils import extend_schema, extend_schema_field
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView

from . import selectors, services
from .identifiers import is_valid_phone, normalize_email, normalize_phone
from .models import RoleName, User


class UserOutputSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.CharField()
    phone = serializers.CharField(allow_null=True)
    email = serializers.EmailField(allow_null=True)
    language = serializers.CharField()
    roles = serializers.SerializerMethodField()

    @extend_schema_field(serializers.ListField(child=serializers.CharField()))
    def get_roles(self, user):
        return sorted(role.name for role in user.roles.all())

    class Meta:
        ref_name = "User"


class AuthOutputSerializer(serializers.Serializer):
    user = UserOutputSerializer()
    access = serializers.CharField()
    refresh = serializers.CharField()

    class Meta:
        ref_name = "AuthResult"


def _auth_response(result: services.AuthResult, *, status_code: int) -> Response:
    data = AuthOutputSerializer(
        {"user": result.user, "access": result.access, "refresh": result.refresh}
    ).data
    return Response(data, status=status_code)


class RegisterApi(APIView):
    permission_classes = [AllowAny]  # nobody is logged in yet
    authentication_classes = []

    class InputSerializer(serializers.Serializer):
        full_name = serializers.CharField(max_length=150)
        phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
        email = serializers.EmailField(required=False, allow_blank=True)
        password = serializers.CharField(write_only=True, trim_whitespace=False)
        role = serializers.ChoiceField(choices=RoleName.PUBLIC)  # never "staff"
        language = serializers.ChoiceField(choices=User.Language.choices, required=False)

        class Meta:
            ref_name = "RegisterInput"

        def validate_phone(self, value):
            if not value:
                return None
            value = normalize_phone(value)
            if not is_valid_phone(value):
                raise serializers.ValidationError(
                    "Enter a valid phone number: 8 to 15 digits, optional leading +."
                )
            return value

        def validate_email(self, value):
            return normalize_email(value) if value else None

        def validate(self, attrs):
            if not attrs.get("phone") and not attrs.get("email"):
                raise serializers.ValidationError("Give a phone number or an email address.")
            candidate = User(
                full_name=attrs["full_name"], phone=attrs.get("phone"), email=attrs.get("email")
            )
            try:
                validate_password(attrs["password"], user=candidate)
            except DjangoValidationError as error:
                raise serializers.ValidationError({"password": list(error.messages)}) from None
            return attrs

    @extend_schema(request=InputSerializer, responses={201: AuthOutputSerializer})
    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = services.register_user(**serializer.validated_data)
        return _auth_response(result, status_code=status.HTTP_201_CREATED)


class LoginApi(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    class InputSerializer(serializers.Serializer):
        identifier = serializers.CharField(help_text="Phone number or email")
        password = serializers.CharField(write_only=True, trim_whitespace=False)

        class Meta:
            ref_name = "LoginInput"

    @extend_schema(request=InputSerializer, responses={200: AuthOutputSerializer})
    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = services.login_user(**serializer.validated_data)
        return _auth_response(result, status_code=status.HTTP_200_OK)


class RefreshApi(TokenRefreshView):
    """POST auth/refresh: a new access token (with the roles) from a refresh token."""

    permission_classes = [AllowAny]
    authentication_classes = []


class MeApi(APIView):
    permission_classes = [IsAuthenticated]

    class InputSerializer(serializers.Serializer):
        full_name = serializers.CharField(max_length=150, required=False)
        language = serializers.ChoiceField(choices=User.Language.choices, required=False)

        class Meta:
            ref_name = "MeUpdateInput"

    @extend_schema(responses={200: UserOutputSerializer})
    def get(self, request):
        user = selectors.get_user(user_id=request.user.id)
        return Response(UserOutputSerializer(user).data)

    @extend_schema(request=InputSerializer, responses={200: UserOutputSerializer})
    def patch(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = services.update_me(user_id=request.user.id, **serializer.validated_data)
        return Response(UserOutputSerializer(user).data)