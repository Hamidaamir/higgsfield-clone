"""Small image helpers built on Pillow (dimension probing, format sniffing)."""

import io

from PIL import Image, UnidentifiedImageError

_FORMAT_MIME = {"PNG": "image/png", "JPEG": "image/jpeg", "WEBP": "image/webp", "GIF": "image/gif"}


def image_dimensions(data: bytes) -> tuple[int, int, str] | None:
    """Return (width, height, mime_type) for encoded image bytes, or None if not an image."""
    try:
        with Image.open(io.BytesIO(data)) as img:
            mime = _FORMAT_MIME.get(img.format or "", "")
            if not mime:
                return None
            return img.width, img.height, mime
    except (UnidentifiedImageError, OSError, ValueError):
        return None
