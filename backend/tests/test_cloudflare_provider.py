import base64
import json

import httpx
import pytest

from app.providers.base import ImageGenerationRequest, ProviderError, ProviderErrorCode
from app.providers.cloudflare_image import CloudflareImageProvider
from tests.fakes import png_bytes

SCHNELL = "@cf/black-forest-labs/flux-1-schnell"
SDXL = "@cf/bytedance/stable-diffusion-xl-lightning"
KLEIN = "@cf/black-forest-labs/flux-2-klein-4b"
REQUEST = ImageGenerationRequest(prompt="a cat", width=1344, height=768, steps=4)


def provider_with(handler) -> CloudflareImageProvider:  # type: ignore[no-untyped-def]
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    return CloudflareImageProvider("acct", "token", client=client)


async def test_schnell_json_base64_response_is_decoded() -> None:
    seen: dict[str, object] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        seen["auth"] = request.headers["authorization"]
        seen["body"] = json.loads(request.content)
        image = base64.b64encode(png_bytes(1024, 1024)).decode()
        return httpx.Response(200, json={"result": {"image": image}, "success": True})

    output = await provider_with(handler).generate(SCHNELL, REQUEST)
    assert seen["url"].endswith(f"/accounts/acct/ai/run/{SCHNELL}")  # type: ignore[union-attr]
    assert seen["auth"] == "Bearer token"
    assert seen["body"] == {"prompt": "a cat", "steps": 4}  # schnell ignores width/height
    assert (output.width, output.height, output.mime_type) == (1024, 1024, "image/png")


async def test_sdxl_binary_response_and_dimensions() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        assert body["width"] == 1344 and body["height"] == 768 and body["num_steps"] == 4
        return httpx.Response(200, content=png_bytes(1344, 768), headers={"content-type": "image/png"})

    output = await provider_with(handler).generate(SDXL, REQUEST)
    assert (output.width, output.height) == (1344, 768)


async def test_klein_uses_multipart() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["content-type"].startswith("multipart/form-data")
        assert b'name="prompt"' in request.content
        image = base64.b64encode(png_bytes(64, 64)).decode()
        return httpx.Response(200, json={"result": {"image": image}})

    output = await provider_with(handler).generate(KLEIN, REQUEST)
    assert output.mime_type == "image/png"


@pytest.mark.parametrize(
    ("status", "body", "expected"),
    [
        (429, {"errors": [{"code": 1, "message": "rate limited"}]}, ProviderErrorCode.RATE_LIMITED),
        (
            403,
            {"errors": [{"code": 2, "message": "neuron quota exceeded"}]},
            ProviderErrorCode.QUOTA_EXCEEDED,
        ),
        (
            400,
            {"errors": [{"code": 3030, "message": "Your output has been flagged"}]},
            ProviderErrorCode.CONTENT_REJECTED,
        ),
        (404, {"errors": [{"code": 7000, "message": "No route"}]}, ProviderErrorCode.MODEL_UNAVAILABLE),
        (503, "upstream unavailable", ProviderErrorCode.MODEL_UNAVAILABLE),
        (500, {"errors": [{"code": 9, "message": "boom"}]}, ProviderErrorCode.PROVIDER_ERROR),
    ],
)
async def test_http_errors_are_classified(status: int, body: object, expected: ProviderErrorCode) -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        if isinstance(body, dict):
            return httpx.Response(status, json=body)
        return httpx.Response(status, text=str(body))

    with pytest.raises(ProviderError) as exc_info:
        await provider_with(handler).generate(SCHNELL, REQUEST)
    assert exc_info.value.code == expected
    assert exc_info.value.user_message  # always has a safe message


async def test_malformed_and_timeout() -> None:
    def bad_json(_: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"result": {}})

    with pytest.raises(ProviderError) as exc_info:
        await provider_with(bad_json).generate(SCHNELL, REQUEST)
    assert exc_info.value.code == ProviderErrorCode.MALFORMED_RESPONSE

    def not_an_image(_: httpx.Request) -> httpx.Response:
        return httpx.Response(200, content=b"x" * 500, headers={"content-type": "image/png"})

    with pytest.raises(ProviderError) as exc_info:
        await provider_with(not_an_image).generate(SDXL, REQUEST)
    assert exc_info.value.code == ProviderErrorCode.MALFORMED_RESPONSE

    def timeout(_: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("slow")

    with pytest.raises(ProviderError) as exc_info:
        await provider_with(timeout).generate(SCHNELL, REQUEST)
    assert exc_info.value.code == ProviderErrorCode.TIMEOUT
