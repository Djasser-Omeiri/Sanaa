from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image


UNKNOWN_TRADE_ID = 999_999  # no trade has this id


def make_image(name="photo.png", image_format="PNG", size=(10, 10)) -> SimpleUploadedFile:
    buffer = BytesIO()
    Image.new("RGB", size, "red").save(buffer, format=image_format)
    content_type = f"image/{image_format.lower()}"
    return SimpleUploadedFile(name, buffer.getvalue(), content_type=content_type)
