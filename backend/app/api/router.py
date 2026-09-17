from fastapi import APIRouter

from app.api.routes import assets, auth, auth_google, generations, health, models

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(auth_google.router)
api_router.include_router(models.router)
api_router.include_router(generations.router)
api_router.include_router(assets.router)
