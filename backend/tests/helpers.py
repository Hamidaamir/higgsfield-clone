"""Small helpers shared by the test-suite."""

import io

from PIL import Image


def png_bytes(width: int = 64, height: int = 64) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (width, height), (214, 255, 0)).save(buffer, format="PNG")
    return buffer.getvalue()
