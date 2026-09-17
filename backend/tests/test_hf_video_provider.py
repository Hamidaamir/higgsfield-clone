from pathlib import Path
from typing import Any

import pytest

from app.providers.base import ProviderError, ProviderErrorCode, VideoGenerationRequest
from app.providers.hf_space_video import HFSpaceVideoProvider, _classify, _read_output

REQUEST = VideoGenerationRequest(prompt="a cat", width=768, height=448, duration_s=3)
SPACE = "Lightricks/ltx-video-distilled"


class StubClient:
    def __init__(self, result: Any = None, error: Exception | None = None) -> None:
        self.result = result
        self.error = error
        self.calls: list[dict[str, Any]] = []

    def predict(self, **kwargs: Any) -> Any:
        self.calls.append(kwargs)
        if self.error:
            raise self.error
        return self.result


def provider_with(stub: StubClient) -> HFSpaceVideoProvider:
    provider = HFSpaceVideoProvider(token="hf_test_token_not_real")
    provider._clients[SPACE] = stub  # bypass the network handshake
    return provider


def fake_mp4(tmp_path: Path) -> Path:
    path = tmp_path / "out.mp4"
    path.write_bytes(b"\x00\x00\x00\x18ftypisom" + b"\x00" * 2000)
    return path


async def test_text_to_video_maps_request_and_reads_mp4(tmp_path: Path) -> None:
    stub = StubClient(result=[{"video": str(fake_mp4(tmp_path)), "subtitles": None}, 123])
    output = await provider_with(stub).generate(SPACE, REQUEST)
    assert output.mime_type == "video/mp4" and output.data[4:8] == b"ftyp"
    call = stub.calls[0]
    assert call["api_name"] == "/text_to_video" and call["mode"] == "text-to-video"
    assert (call["width_ui"], call["height_ui"], call["duration_ui"]) == (768, 448, 3)
    assert call["randomize_seed"] is True and call["input_image_filepath"] is None
    assert not (tmp_path / "out.mp4").exists()  # provider temp file cleaned up


async def test_image_to_video_uses_reference(tmp_path: Path) -> None:
    stub = StubClient(result=[{"video": str(fake_mp4(tmp_path)), "subtitles": None}, 1])
    request = VideoGenerationRequest(
        prompt="move", width=512, height=512, duration_s=2, seed=7, reference_image=b"\x89PNG fake"
    )
    await provider_with(stub).generate(SPACE, request)
    call = stub.calls[0]
    assert call["api_name"] == "/image_to_video" and call["mode"] == "image-to-video"
    assert call["input_image_filepath"] is not None
    assert call["seed_ui"] == 7 and call["randomize_seed"] is False


@pytest.mark.parametrize(
    ("message", "expected"),
    [
        (
            "You have exceeded your ZeroGPU quota (120s requested vs. -60s left).",
            ProviderErrorCode.QUOTA_EXCEEDED,
        ),
        ("401 Client Error: Unauthorized", ProviderErrorCode.AUTH_FAILED),
        ("The read operation timed out", ProviderErrorCode.TIMEOUT),
        ("Could not fetch config for https://... Space is sleeping", ProviderErrorCode.MODEL_UNAVAILABLE),
        ("Queue is full, request rejected", ProviderErrorCode.RATE_LIMITED),
        ("Something odd", ProviderErrorCode.PROVIDER_ERROR),
    ],
)
def test_error_classification(message: str, expected: ProviderErrorCode) -> None:
    error = _classify(RuntimeError(message), "predict")
    assert error.code == expected
    if expected == ProviderErrorCode.QUOTA_EXCEEDED:
        assert error.user_message.startswith("Daily free video generation quota has been used")
        assert "requested" not in error.user_message


async def test_predict_error_drops_cached_client() -> None:
    stub = StubClient(error=RuntimeError("You have exceeded your ZeroGPU quota"))
    provider = provider_with(stub)
    with pytest.raises(ProviderError) as exc_info:
        await provider.generate(SPACE, REQUEST)
    assert exc_info.value.code == ProviderErrorCode.QUOTA_EXCEEDED
    assert SPACE not in provider._clients


def test_malformed_outputs(tmp_path: Path) -> None:
    with pytest.raises(ProviderError) as exc_info:
        _read_output([{"video": None}, 1])
    assert exc_info.value.code == ProviderErrorCode.MALFORMED_RESPONSE
    bad = tmp_path / "bad.mp4"
    bad.write_bytes(b"not a video")
    with pytest.raises(ProviderError):
        _read_output([{"video": str(bad)}, 1])
