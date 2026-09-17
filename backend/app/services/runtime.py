"""Process-wide wiring of providers, storage and background tasks.

Built once at startup from settings and stored on `app.state`; tests replace it with fakes.
"""

import asyncio
import logging
from collections.abc import Coroutine
from dataclasses import dataclass, field
from typing import Any

from app.config import Settings
from app.providers.base import ImageGenerationProvider, VideoGenerationProvider
from app.providers.cloudflare_image import CloudflareImageProvider
from app.providers.fake_image import FakeImageProvider
from app.providers.fake_video import FakeVideoProvider
from app.providers.hf_space_video import HFSpaceVideoProvider
from app.storage.base import MediaStorage
from app.storage.cloudinary_storage import CloudinaryStorage
from app.storage.fake_storage import FakeStorage

log = logging.getLogger(__name__)


@dataclass
class GenerationRuntime:
    image_provider: ImageGenerationProvider | None
    storage: MediaStorage | None
    video_provider: VideoGenerationProvider | None = None
    _tasks: set[asyncio.Task[None]] = field(default_factory=set)

    def spawn(self, coro: Coroutine[Any, Any, None]) -> asyncio.Task[None]:
        """Run a job in-process without holding the HTTP request open."""
        task = asyncio.create_task(coro)
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)
        return task

    async def wait_idle(self) -> None:
        """Await every in-flight job (used by tests and graceful shutdown)."""
        while self._tasks:
            await asyncio.gather(*list(self._tasks), return_exceptions=True)


def build_runtime(settings: Settings) -> GenerationRuntime:
    if settings.use_fake_providers:
        log.warning("USE_FAKE_PROVIDERS is on: generations use in-process fakes, not real models")
        return GenerationRuntime(
            image_provider=FakeImageProvider(latency_s=settings.fake_provider_latency_s),
            storage=FakeStorage(),
            video_provider=FakeVideoProvider(latency_s=settings.fake_provider_latency_s),
        )

    image_provider: ImageGenerationProvider | None = None
    if settings.cloudflare_account_id and settings.cloudflare_api_token:
        image_provider = CloudflareImageProvider(
            settings.cloudflare_account_id, settings.cloudflare_api_token.get_secret_value()
        )
    else:
        log.warning("Cloudflare credentials missing: image generation disabled")

    storage: MediaStorage | None = None
    if settings.cloudinary_cloud_name and settings.cloudinary_api_key and settings.cloudinary_api_secret:
        storage = CloudinaryStorage(
            settings.cloudinary_cloud_name,
            settings.cloudinary_api_key,
            settings.cloudinary_api_secret.get_secret_value(),
            root_folder=f"higgsfield-clone/{settings.app_env}",
        )
    else:
        log.warning("Cloudinary credentials missing: media storage disabled")

    video_provider: VideoGenerationProvider | None = None
    if settings.hf_token:
        video_provider = HFSpaceVideoProvider(settings.hf_token.get_secret_value())
    else:
        log.warning("HF_TOKEN missing: video generation disabled")

    return GenerationRuntime(image_provider=image_provider, storage=storage, video_provider=video_provider)
