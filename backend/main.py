
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database.db import init_db
from routes import employee_routes, attendance_routes

# Lifespan context manager for startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database connection
    await init_db()
    yield
    # Shutdown: Close database connection if needed
    pass

# Create FastAPI application instance
app = FastAPI(
    title="HRMS Lite API",
    description="Human Resource Management System API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(employee_routes.router, prefix="/api/employees", tags=["employees"])
app.include_router(attendance_routes.router, prefix="/api/attendance", tags=["attendance"])

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "HRMS Lite API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)

