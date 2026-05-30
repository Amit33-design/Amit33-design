from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import users, nutrition, workouts, lifestyle, progress, ai_chat

app = FastAPI(
    title="HealthCopilot API",
    description="AI-Powered Health, Nutrition, Fitness & Lifestyle Recommendation Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/v1")
app.include_router(nutrition.router, prefix="/api/v1")
app.include_router(workouts.router, prefix="/api/v1")
app.include_router(lifestyle.router, prefix="/api/v1")
app.include_router(progress.router, prefix="/api/v1")
app.include_router(ai_chat.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "health-copilot-api"}


@app.get("/health/ready")
async def readiness():
    from app.database import engine
    try:
        async with engine.connect() as conn:
            await conn.execute(engine.dialect.has_table.__func__(conn, "users"))
        return {"status": "ready"}
    except Exception as e:
        from fastapi import Response
        return Response(status_code=503, content=f"Database not ready: {e}")
