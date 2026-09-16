"""Spike 2: Cloudinary upload/delete from bytes (free tier, no card)."""

import io
import struct
import zlib

import cloudinary
import cloudinary.uploader

from app.config import get_settings
from scripts.spikes._common import require, timed


def tiny_png(width: int = 64, height: int = 64) -> bytes:
    """A lime 64x64 PNG built by hand so the spike needs no imaging dependency."""
    raw = b"".join(b"\x00" + b"\xd6\xff\x00" * width for _ in range(height))

    def chunk(kind: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(kind + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    signature = b"\x89PNG\r\n\x1a\n"
    return signature + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")


def main() -> None:
    s = get_settings()
    secret = s.cloudinary_api_secret.get_secret_value() if s.cloudinary_api_secret else None
    cloudinary.config(
        cloud_name=require(s.cloudinary_cloud_name, "CLOUDINARY_CLOUD_NAME"),
        api_key=require(s.cloudinary_api_key, "CLOUDINARY_API_KEY"),
        api_secret=require(secret, "CLOUDINARY_API_SECRET"),
        secure=True,
    )
    result = timed(
        "upload 64x64 png",
        lambda: cloudinary.uploader.upload(
            io.BytesIO(tiny_png()), folder="higgsfield-spike", resource_type="image"
        ),
    )
    print(f"       url={result['secure_url']} bytes={result['bytes']}")
    timed("destroy", lambda: cloudinary.uploader.destroy(result["public_id"], resource_type="image"))


if __name__ == "__main__":
    main()
