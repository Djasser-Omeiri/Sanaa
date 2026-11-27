import pytest

from apps.jobs.models import request_photo_path


@pytest.mark.parametrize(
    "filename, extension",
    [
        ("kitchen.jpg", ".jpg"),
        ("kitchen.JPEG", ".jpeg"),  # upper case is accepted and stored in lower case
        ("tap.png", ".png"),
        ("wall.webp", ".webp"),
    ],
)
def test_photo_path_keeps_an_allowed_extension(filename, extension):
    path = request_photo_path(None, filename)
    assert path.startswith("requests/")
    assert path.endswith(extension)


@pytest.mark.parametrize("filename", ["virus.exe", "shell.php", "photo.gif", "no_extension"])
def test_photo_path_replaces_any_other_extension_with_jpg(filename):
    assert request_photo_path(None, filename).endswith(".jpg")


def test_photo_path_never_keeps_the_original_name():
    first = request_photo_path(None, "kitchen.png")
    second = request_photo_path(None, "kitchen.png")
    assert "kitchen" not in first
    assert first != second  # a new random name every time
