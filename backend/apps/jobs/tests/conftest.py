import pytest

from apps.accounts import services as account_services
from apps.workers import selectors as worker_selectors

PASSWORD = "Str0ng-Pass-2026"


@pytest.fixture(autouse=True)
def media_in_tmp(settings, tmp_path):
    """Uploaded test photos go to a temporary folder, not to the real media folder."""
    settings.MEDIA_ROOT = tmp_path


def _register(role: str, phone: str):
    return account_services.register_user(
        full_name=f"Test {role}", password=PASSWORD, role=role, phone=phone
    )


@pytest.fixture
def client_auth():
    """A registered client: .user and .access (the JWT)."""
    return _register("client", "0555000001")


@pytest.fixture
def other_client_auth():
    return _register("client", "0555000002")


@pytest.fixture
def worker_auth():
    return _register("worker", "0555000003")


@pytest.fixture
def trade_id() -> int:
    """A real trade, created by the workers data migration (task B1.2)."""
    return worker_selectors.list_trades().first().id


@pytest.fixture
def request_data(trade_id):
    return {
        "trade_id": trade_id,
        "description": "The kitchen tap is leaking.",
        "latitude": "36.713400",
        "longitude": "3.181200",
        "general_area": "Bab Ezzouar",
    }
