from django import forms
from django.contrib import admin
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from .identifiers import is_valid_phone, normalize_email, normalize_phone
from .models import Role, User


class UserAdminForm(forms.ModelForm):
    new_password = forms.CharField(
        label="Password",
        required=False,
        widget=forms.PasswordInput(render_value=False),
        help_text="Required for a new user. Leave empty to keep the current password.",
    )

    class Meta:
        model = User
        fields = (
            "full_name",
            "phone",
            "email",
            "language",
            "roles",
            "is_active",
            "is_staff",
            "is_superuser",
        )

    def clean_phone(self):
        value = self.cleaned_data.get("phone")
        if not value:
            return None
        value = normalize_phone(value)
        if not is_valid_phone(value):
            raise ValidationError("Enter a valid phone number (8 to 15 digits, optional +).")
        return value

    def clean_email(self):
        value = self.cleaned_data.get("email")
        return normalize_email(value) if value else None

    def clean(self):
        data = super().clean()
        if not data.get("phone") and not data.get("email"):
            raise ValidationError("Give a phone number or an email address.")
        password = data.get("new_password")
        if not self.instance.pk and not password:
            self.add_error("new_password", "A password is required for a new user.")
        if password:
            try:
                validate_password(password, user=self.instance)
            except ValidationError as error:
                self.add_error("new_password", error)
        return data


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    form = UserAdminForm
    list_display = ("full_name", "phone", "email", "language", "is_active", "created_at")
    list_filter = ("roles", "language", "is_active")
    search_fields = ("full_name", "phone", "email")
    ordering = ("-created_at",)
    filter_horizontal = ("roles",)
    fieldsets = (
        (None, {"fields": ("full_name", "phone", "email", "new_password", "language")}),
        ("SANAA roles", {"fields": ("roles",)}),
        ("Django admin access", {"fields": ("is_active", "is_staff", "is_superuser")}),
    )

    def save_model(self, request, obj, form, change):
        password = form.cleaned_data.get("new_password")
        if password:
            obj.set_password(password)
        elif not change:
            obj.set_unusable_password()
        super().save_model(request, obj, form, change)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name",)