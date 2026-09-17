"""Small dependency-free audio helpers: container sniffing, WAV duration, PCM -> WAV."""

import io
import struct
import wave
from dataclasses import dataclass


@dataclass(frozen=True)
class AudioInfo:
    mime_type: str
    duration_ms: int | None


def sniff_audio(data: bytes) -> AudioInfo | None:
    """Identify WAV / MP3 bytes (the formats our TTS providers return)."""
    if data[:4] == b"RIFF" and data[8:12] == b"WAVE":
        return AudioInfo("audio/wav", wav_duration_ms(data))
    if data[:3] == b"ID3" or (len(data) > 2 and data[0] == 0xFF and (data[1] & 0xE0) == 0xE0):
        return AudioInfo("audio/mpeg", None)
    return None


def wav_duration_ms(data: bytes) -> int | None:
    try:
        with wave.open(io.BytesIO(data)) as handle:
            frames = handle.getnframes()
            rate = handle.getframerate()
            return int(frames * 1000 / rate) if rate else None
    except (wave.Error, EOFError, OSError):
        return None


def pcm16_to_wav(pcm: bytes, *, sample_rate: int, channels: int = 1) -> bytes:
    """Wrap raw little-endian 16-bit PCM in a WAV container (what Gemini TTS returns)."""
    fmt = struct.pack("<IHHIIHH", 16, 1, channels, sample_rate, sample_rate * channels * 2, channels * 2, 16)
    header = b"RIFF" + struct.pack("<I", 36 + len(pcm)) + b"WAVEfmt " + fmt
    return header + b"data" + struct.pack("<I", len(pcm)) + pcm
