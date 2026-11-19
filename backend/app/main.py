from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import close_db_pool, init_db_pool
from app.routers import actions, alerts, auth, forensics, whitelist
from app.seed import ensure_database_seeded


@asynccontextmanager
async def lifespan(app: FastAPI):
    pool = await init_db_pool()
    async with pool.acquire() as conn:
        await ensure_database_seeded(conn)
    yield
    await close_db_pool()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "API REST para el Sistema de Monitoreo Analítico del Comportamiento de Usuarios y Entidades "
        "(UEBA) del Sector Salud. Cumplimiento normativo Ley 1581 de 2012, HIPAA, BR-001 y BR-002."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail
    if isinstance(detail, dict) and "code" in detail:
        error_payload = {
            "code": detail.get("code", "HTTP_ERROR"),
            "message": detail.get("message", "Error en la solicitud."),
            "details": detail.get("details"),
        }
    else:
        error_payload = {
            "code": f"HTTP_{exc.status_code}",
            "message": str(detail),
            "details": None,
        }
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": error_payload},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    errors = exc.errors()
    first_msg = "Datos de entrada inválidos."
    if errors:
        first_msg = errors[0].get("msg", first_msg)
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": first_msg,
                "details": [
                    {
                        "loc": list(e.get("loc", [])),
                        "msg": e.get("msg", ""),
                        "type": e.get("type", ""),
                    }
                    for e in errors
                ],
            },
        },
    )


app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(actions.router, prefix=settings.API_V1_STR)
app.include_router(whitelist.router, prefix=settings.API_V1_STR)
app.include_router(forensics.router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health_check() -> Dict[str, Any]:
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "br_001_auto_block_threshold": settings.AUTO_BLOCK_THRESHOLD,
            "br_002_critical_units": list(settings.CRITICAL_UNITS),
        },
    }


frontend_dir = Path(__file__).resolve().parents[2] / "frontend"
if not frontend_dir.exists():
    frontend_dir = Path("/app/frontend")
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")

