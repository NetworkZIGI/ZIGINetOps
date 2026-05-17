from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, packet_analysis
from app.core.config import get_settings
from app.core.errors import AppError, app_error_handler
from app.core.logging import configure_logging


def create_app() -> FastAPI:
    configure_logging()
    settings = get_settings()
    settings.pcap_dir.mkdir(parents=True, exist_ok=True)
    settings.csv_dir.mkdir(parents=True, exist_ok=True)

    app = FastAPI(title=settings.app_name)
    app.add_exception_handler(AppError, app_error_handler)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_origin_regex=settings.cors_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router, prefix=settings.api_prefix)
    app.include_router(packet_analysis.router, prefix=settings.api_prefix)
    return app


app = create_app()
